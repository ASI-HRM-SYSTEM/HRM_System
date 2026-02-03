interface FooterProps {
  developerName: string;
  linkedinUrl: string;
}

function Footer({ developerName, linkedinUrl }: FooterProps) {
  const handleClick = async () => {
    // Open LinkedIn profile in default browser
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(linkedinUrl);
  };

  return (
    <footer className="bg-white border-t border-gray-200 py-3 px-6">
      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
        <span>Developed by</span>
        <button
          onClick={handleClick}
          className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
        >
          {developerName}
        </button>
        <svg 
          className="w-4 h-4 text-blue-600" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      </div>
    </footer>
  );
}

export default Footer;
