import React, { useState } from 'react';
import {visionService} from "@/services/image-analyzer-service.ts";
// Importă noul serviciu pe care tocmai l-ai creat

export default function TestVision() {
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageBase64(reader.result as string);
            setResult(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!imageBase64) {
            setError("Te rog să selectezi o poză mai întâi.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // 🚀 Aici folosim serviciul corect, autorizat!
            const data = await visionService.analyzeImage({ image: imageBase64 });

            // Afișăm rezultatul
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Eroare la apelul API.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ marginBottom: '1rem' }}>Testare API Vision (GPT-4o-mini)</h2>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp, image/gif"
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
            </div>

            {imageBase64 && (
                <div style={{ marginBottom: '1rem' }}>
                    <img
                        src={imageBase64}
                        alt="Preview"
                        style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                </div>
            )}

            <button
                onClick={handleAnalyze}
                disabled={!imageBase64 || isLoading}
                style={{
                    padding: '10px 20px',
                    backgroundColor: isLoading ? '#ccc' : '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                }}
            >
                {isLoading ? 'Se analizează...' : 'Trimite spre analiză'}
            </button>

            {error && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ffe6e6', color: '#cc0000', borderRadius: '5px' }}>
                    <strong>Eroare:</strong> {error}
                </div>
            )}

            {result && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                    <h3 style={{ marginTop: 0 }}>Rezultat Backend:</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
                </div>
            )}
        </div>
    );
}