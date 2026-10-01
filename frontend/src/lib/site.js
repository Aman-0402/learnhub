// Edit these before launch. They are placeholders, not real contact details.
export const SITE = {
  name: "LearnHub",
  // The public address of the site (no trailing slash). Used for canonical links and sharing tags. Set VITE_SITE_URL when you deploy.
  url: (import.meta.env.VITE_SITE_URL || "https://learnhub.example").replace(/\/$/, ""),
  image: "/og-image.png",
  email: "hello@learnhub.example",
  phone: "+91 00000 00000",
  address: "Your centre address, Vadodara, Gujarat",
  hours: "Mon to Sat, 9:00 am to 6:00 pm",
};

// Owner details for the portfolio page. Replace the email with the one you want visitors to use.
export const OWNER = {
  name: "Aman Raj",
  email: "your-email@example.com",
  github: "https://github.com/Aman-0402",
};
