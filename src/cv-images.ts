async function cvLoadImageAsDataUrl(url: string, runtime: CvRuntimeEnvironment): Promise<string | null> {
    const normalizedUrl = cvTryResolveSafeUrl(url, runtime.locationHref);
    if (!normalizedUrl) {
        return null;
    }

    try {
        const response = await runtime.runtimeWindow.fetch(normalizedUrl.href, {
            credentials: normalizedUrl.origin === runtime.runtimeWindow.location.origin ? 'same-origin' : 'omit'
        });

        if (!response.ok) {
            return null;
        }

        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            return null;
        }

        return await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                resolve(result.startsWith('data:image/') ? result : null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        runtime.logger.warn('Não foi possível carregar uma imagem do portfólio.', error);
        return null;
    }
}

async function cvWaitForImageElement(imageElement: HTMLImageElement, runtime: CvRuntimeEnvironment): Promise<void> {
    if (imageElement.loading === 'lazy') {
        imageElement.loading = 'eager';
    }

    if (imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        let settled = false;

        const cleanup = (): void => {
            runtime.runtimeWindow.clearTimeout(timeoutId);
            imageElement.removeEventListener('load', onLoad);
            imageElement.removeEventListener('error', onError);
        };

        const settle = (callback: () => void): void => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            callback();
        };

        const onLoad = (): void => settle(resolve);
        const onError = (): void => settle(() => reject(new Error('Falha ao carregar imagem do elemento')));

        const timeoutId = runtime.runtimeWindow.setTimeout(() => {
            settle(() => reject(new Error('Timeout ao carregar imagem do elemento')));
        }, CV_IMAGE_LOAD_TIMEOUT_MS);

        imageElement.addEventListener('load', onLoad, { once: true });
        imageElement.addEventListener('error', onError, { once: true });

        const source = cvGetImageSource(imageElement);
        if (source && !imageElement.getAttribute('src')) {
            imageElement.src = source;
        }
    });
}

async function cvImageElementToDataUrl(
    imageElement: HTMLImageElement,
    runtime: CvRuntimeEnvironment
): Promise<string | null> {
    const source = cvGetImageSource(imageElement);

    try {
        await cvWaitForImageElement(imageElement, runtime);

        if (typeof imageElement.decode === 'function') {
            try {
                await imageElement.decode();
            } catch {
                // Alguns navegadores rejeitam decode() mesmo depois de a imagem carregar.
            }
        }

        if (imageElement.naturalWidth <= 0 || imageElement.naturalHeight <= 0) {
            return source ? cvLoadImageAsDataUrl(source, runtime) : null;
        }

        const canvas = runtime.runtimeDocument.createElement('canvas');
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;

        const context = canvas.getContext('2d');
        if (!context) {
            return source ? cvLoadImageAsDataUrl(source, runtime) : null;
        }

        context.drawImage(imageElement, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        return dataUrl.startsWith('data:image/') ? dataUrl : null;
    } catch (error) {
        runtime.logger.warn('Falha ao converter uma imagem do DOM; usando fallback.', error);
        return source ? cvLoadImageAsDataUrl(source, runtime) : null;
    }
}

function cvDetectImageFormat(dataUrl: string): ImageFormat {
    return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

function cvGetProfileImageElement(runtime: CvRuntimeEnvironment): HTMLImageElement | null {
    const selectors = [
        '.topo-foto img',
        '.foto-perfil img',
        '.minha-foto img',
        'img[src*="minhafoto"]',
        'img[alt*="Daniel"]'
    ];

    for (const selector of selectors) {
        const image = runtime.runtimeDocument.querySelector(selector) as HTMLImageElement | null;
        if (image) {
            return image;
        }
    }

    return null;
}

async function cvResolveImageDataUrl(
    imageElement: HTMLImageElement | null,
    fallbackUrl: string,
    runtime: CvRuntimeEnvironment
): Promise<string | null> {
    if (imageElement) {
        const fromElement = await cvImageElementToDataUrl(imageElement, runtime);
        if (fromElement) {
            return fromElement;
        }
    }

    return fallbackUrl ? cvLoadImageAsDataUrl(fallbackUrl, runtime) : null;
}

async function cvResolveProfilePhotoDataUrl(runtime: CvRuntimeEnvironment): Promise<string | null> {
    const embeddedPhoto = cvGetEmbeddedPhotoDataUrl(runtime);
    if (embeddedPhoto.startsWith('data:image/')) {
        return embeddedPhoto;
    }

    return cvResolveImageDataUrl(cvGetProfileImageElement(runtime), '', runtime);
}

function cvIsPreparedCertificateAttachment(
    value: PreparedCertificateAttachment | null
): value is PreparedCertificateAttachment {
    return Boolean(value?.dataUrl.startsWith('data:image/'));
}

async function cvPrepareCertificateAttachment(
    attachment: CertificateAttachment,
    embeddedByAssetKey: ReadonlyMap<string, EmbeddedCertificateAttachment>,
    runtime: CvRuntimeEnvironment
): Promise<PreparedCertificateAttachment | null> {
    const assetKey = cvNormalizeCertificateAssetKey(attachment.src, runtime.locationHref);
    const embedded = embeddedByAssetKey.get(assetKey);

    // Prioriza o anexo incorporado no build para evitar dependência de carregamento da UI.
    const dataUrl = embedded?.dataUrl
        || await cvResolveImageDataUrl(attachment.imageElement, attachment.src, runtime)
        || '';

    if (!dataUrl.startsWith('data:image/')) {
        return null;
    }

    return {
        title: attachment.title,
        dataUrl,
        format: cvDetectImageFormat(dataUrl)
    };
}

async function cvPrepareCertificateAttachments(
    attachments: CertificateAttachment[],
    runtime: CvRuntimeEnvironment
): Promise<PreparedCertificateAttachment[]> {
    const embeddedByAssetKey = new Map(
        cvGetEmbeddedCertificateAttachments(runtime).map((attachment) => [
            cvNormalizeCertificateAssetKey(attachment.title, runtime.locationHref),
            attachment
        ])
    );

    const results = await Promise.all(
        attachments.map((attachment) => cvPrepareCertificateAttachment(attachment, embeddedByAssetKey, runtime))
    );

    return results.filter(cvIsPreparedCertificateAttachment);
}
