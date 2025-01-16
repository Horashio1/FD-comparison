// /** @type {import('next').NextConfig} */
// const nextConfig = {};


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,  // Disable Next.js image optimization
    remotePatterns: [
      { hostname: 'res.cloudinary.com' },
      { hostname: 'kbcaevsuxnajykrzhjco.supabase.co' },
      { hostname: 's3.ap-southeast-1.amazonaws.com' },
      { hostname: 'ndbbankweb.ndbbank.com' },
      { hostname: 'www.sampath.lk' },
      { hostname: 'www.hnb.net' },
      { hostname: 'www.seylan.lk' },
      { hostname: 'www.americanexpress.lk' },
      { hostname: 'www.hsbc.lk' },
      { hostname: 'www.peoplesbank.lk' },
    ],
    // You can specify other properties if needed, like protocol, port, etc.
  },
};

export default nextConfig;
