// Feature switches. A switch is false while the matching backend endpoint does not exist yet:
// the page then runs on built-in sample data and says so. Flip it to true once the API is live.
//
//   passwordResetApi  needs  POST /api/auth/password-reset/          {email}
//                            POST /api/auth/password-reset/confirm/  {uid, token, new_password}
//   batchesApi        needs  GET  /api/courses/<slug>/batches/       and  POST /api/enroll/ {course, batch}
export const FEATURES = {
  passwordResetApi: true,
  batchesApi: true,
};
