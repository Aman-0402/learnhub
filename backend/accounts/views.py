from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .emails import send_password_reset_email, send_welcome_email
from .models import User
from .serializers import (
    ChangePasswordSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer,
    RegisterSerializer, UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_welcome_email(user)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=201,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        request.user.set_password(ser.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated."})


class PasswordResetRequestView(generics.GenericAPIView):
    """Always answers the same way, so nobody can use it to find out which emails have accounts."""

    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=ser.validated_data["email"], is_active=True).first()
        if user:
            send_password_reset_email(user)
        return Response({"detail": "If an account exists for that email, a reset link has been sent."})


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        invalid = Response({"detail": "This link is invalid or has expired. Request a new one."}, status=400)
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(ser.validated_data["uid"])), is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return invalid
        if not default_token_generator.check_token(user, ser.validated_data["token"]):
            return invalid
        try:
            validate_password(ser.validated_data["new_password"], user)
        except DjangoValidationError as e:
            return Response({"new_password": list(e.messages)}, status=400)
        user.set_password(ser.validated_data["new_password"])
        user.save(update_fields=["password"])  # changing the password also invalidates the token
        return Response({"detail": "Your password has been reset."})
