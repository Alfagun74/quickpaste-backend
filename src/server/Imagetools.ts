export class ImageTools {
    static getDataUrlFromFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject("FileReader received Type ArrayBuffer instead of Type String");
                }
            }
            reader.onerror = (e) => reject(e)
            reader.readAsDataURL(file)
        })
    };
    static getFilefromDataUrl(dataUrl: string, filename: string, lastModified?: number): File {
        let blob: any = this.dataURLtoBlob(dataUrl)
        blob.name = filename;
        blob.lastModifiedDate = lastModified ?? Date.now;
        return <File>blob;
    };

    static dataURLtoBlob(dataUrl: string) {
        var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)![1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
}