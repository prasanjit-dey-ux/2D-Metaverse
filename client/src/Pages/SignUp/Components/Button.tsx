interface ButtonProps {
    link: string;
    imageSrc?: string;
    altText?: string;
    providerName?: string;
    className?: string; 
}

export default function Button({ 
    link, 
    imageSrc, 
    altText = "Provider logo", 
    providerName = "Provider", 
    className = "" 
}: ButtonProps) {
    return (
        <a 
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`h-8 w-60 sm:h-10 sm:w-[352px] border border-gray-300 hover:bg-yellow-100 flex items-center justify-center flex-shrink-0 rounded-lg gap-2 px-4 cursor-pointer transition ${className}`}
        >
            {imageSrc && <img src={imageSrc} alt={altText} className="h-4 w-4 sm:h-6 sm:w-6" />}
            <p className="text-xs  sm:text-base">Sign In with {providerName}</p>
        </a>
    );
}
