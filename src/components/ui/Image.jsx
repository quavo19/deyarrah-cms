import { useState } from "react";
import { Package } from "lucide-react";

const Image = ({
  src,
  alt = "",
  fallbackIcon = Package,
  className = "",
  iconClassName = "w-24 h-24",
  ...props
}) => {
  const FallbackIcon = fallbackIcon
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center text-gray-400 bg-gray-200 ${className}`}
      >
        <FallbackIcon strokeWidth={0.8} className={iconClassName} />
      </div>
    );
  }

  const hasRounded = className.includes('rounded-')
  const overflowClass = hasRounded ? 'overflow-hidden' : ''

  return (
    <div className={`relative bg-gray-200 ${overflowClass} ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
          <FallbackIcon strokeWidth={0.8} className={iconClassName} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover ${
          imageLoading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-200 ${hasRounded ? className.split(' ').filter(c => c.includes('rounded-')).join(' ') : ''}`}
        {...props}
      />
    </div>
  );
};

export default Image;

