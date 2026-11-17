// 클라이언트 측 이미지 & 오디오 파일 변환 유틸리티 (외부 스토리지 비용 0원 & Vercel 용량 제한 자동 최적화)

export async function compressImageFile(
    file: File,
    maxDimension = 1080,
    quality = 0.82
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("이미지 파일을 읽을 수 없습니다."));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("유효한 이미지 파일이 아닙니다."));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width >= height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(reader.result as string);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL("image/webp", quality);
                resolve(dataUrl);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    });
}

function encodeMonoWav16Bit(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: "audio/wav" });
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("오디오 변환 실패"));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}

export async function processAudioFile(file: File): Promise<{ dataUrl: string; notice?: string }> {
    // 2.8MB 이하의 MP3/M4A/OGG 등은 원본 그대로 Data URL로 변환
    const MAX_DIRECT_BYTES = 2.8 * 1024 * 1024;
    if (file.size <= MAX_DIRECT_BYTES) {
        const dataUrl = await blobToDataUrl(file);
        return { dataUrl };
    }

    // 대용량 WAV/MP3(예: 10~40MB)는 브라우저에서 스트리밍 가능한 경량 데모 포맷으로 자동 리샘플링
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    // 최대 90초 하이라이트 데모, 14000Hz 모노로 경량화 (~2.5MB)
    const maxDuration = Math.min(decoded.duration, 90);
    const targetSampleRate = 14000;
    const length = Math.floor(maxDuration * targetSampleRate);

    const offlineCtx = new OfflineAudioContext(1, length, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const wavBlob = encodeMonoWav16Bit(rendered.getChannelData(0), targetSampleRate);
    const dataUrl = await blobToDataUrl(wavBlob);

    return {
        dataUrl,
        notice: decoded.duration > 90
            ? "대용량 음원이 감지되어 웹 스트리밍에 맞게 1분 30초 데모 프리뷰로 자동 최적화되었습니다."
            : "대용량 음원이 웹 스트리밍용 경량 포맷으로 자동 최적화되었습니다.",
    };
}
