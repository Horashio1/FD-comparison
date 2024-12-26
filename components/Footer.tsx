export default function Footer() {
    return (
        <footer className="w-full py-4 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div className="text-center md:text-left">
                        <p className="text-sm">&copy; 2024 BestRates.lk. All rights reserved.</p>
                    </div>
                    <nav className="flex space-x-4">
                        <a href="/About" className="text-sm hover:underline">About</a>
                        {/* <a href="/privacy" className="text-sm hover:underline">Privacy Policy</a> */}
                    </nav>
 
                </div>
            </div>
        </footer>
    );
}
