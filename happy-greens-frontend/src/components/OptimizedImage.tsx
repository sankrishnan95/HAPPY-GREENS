import { ImgHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { normalizeImageUrl } from '../utils/image';

type OptimizedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    src?: string | null;
    fallbackSrc?: string;
    aspectRatio?: string;
};

const DEFAULT_FALLBACK = normalizeImageUrl(null);

const OptimizedImage = ({
    src,
    alt = '',
    className = '',
    fallbackSrc = DEFAULT_FALLBACK,
    loading = 'lazy',
    decoding = 'async',
    fetchPriority,
    aspectRatio,
    style,
    onError,
    ...props
}: OptimizedImageProps) => {
    const normalizedSrc = useMemo(() => normalizeImageUrl(src, fallbackSrc), [src, fallbackSrc]);
    const [currentSrc, setCurrentSrc] = useState(normalizedSrc);

    useEffect(() => {
        setCurrentSrc(normalizedSrc);
    }, [normalizedSrc]);

    return (
        <img
            {...props}
            src={currentSrc}
            alt={alt}
            loading={loading}
            decoding={decoding}
            fetchPriority={fetchPriority}
            className={className}
            style={aspectRatio ? { ...style, aspectRatio } : style}
            onError={(event) => {
                if (currentSrc !== fallbackSrc) {
                    setCurrentSrc(fallbackSrc);
                }
                onError?.(event);
            }}
        />
    );
};

export default OptimizedImage;
