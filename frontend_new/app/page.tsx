'use client';

import { useState, useRef } from 'react';

interface OrderData {
    bookingNo?: string;
    invoiceNo?: string;
    store: string;
    datetime: string;
    itemCode: string;
    itemName: string;
}

export default function HomePage() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (field: keyof OrderData, value: string) => {
        if (orderData) {
            setOrderData({ ...orderData, [field]: value });
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setOrderData(null);
            setError('');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setOrderData(null);
            setError('');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const analyzeImage = async () => {
        if (!selectedImage) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('image', selectedImage);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze-simple`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || '識別失敗');
            }
            setOrderData(result.data);
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.message || '識別過程發生錯誤');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatItemCode = (code: string, name: string) => {
        if (!code) return '';
        const lowerName = name.toLowerCase();
        let prefix = '';
        if (lowerName.includes('手機') || lowerName.includes('手錶') || lowerName.includes('ipod') || lowerName.includes('pods') || lowerName.includes('phone')) {
            prefix = '42';
        } else if (lowerName.includes('電腦') || lowerName.includes('mac') || lowerName.includes('ipad')) {
            prefix = '45';
        }
        return prefix + code;
    };

    const copyToClipboard = async () => {
        if (!orderData) return;
        const formattedItemCode = formatItemCode(orderData.itemCode, orderData.itemName);
        const text = [
            `1. 店別: ${orderData.store}`,
            `2. 日期時間: ${orderData.datetime}`,
            `3. itemcode: ${formattedItemCode}`,
            `4. 品名: ${orderData.itemName}`,
            orderData.bookingNo && `5. 訂貨編號: ${orderData.bookingNo}`,
            orderData.invoiceNo && `6. 發票號碼: ${orderData.invoiceNo}`,
        ].filter(Boolean).join('\n');
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const shareToApp = async () => {
        if (!orderData || !selectedImage) return;
        const formattedItemCode = formatItemCode(orderData.itemCode, orderData.itemName);
        const text = [
            '📋 訂單資訊',
            `1. 店別: ${orderData.store}`,
            `2. 日期時間: ${orderData.datetime}`,
            `3. itemcode: ${formattedItemCode}`,
            `4. 品名: ${orderData.itemName}`,
            orderData.bookingNo && `5. 訂貨編號: ${orderData.bookingNo}`,
            orderData.invoiceNo && `6. 發票號碼: ${orderData.invoiceNo}`,
        ].filter(Boolean).join('\n');
        try {
            if (navigator.share) {
                await navigator.share({ title: '訂單資訊', text, files: [selectedImage] });
            } else {
                await copyToClipboard();
                alert('已複製文字！請手動分享圖片到 LINE');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                try {
                    await navigator.share({ title: '訂單資訊', text });
                } catch {
                    await copyToClipboard();
                }
            }
        }
    };

    const resetImage = () => {
        setSelectedImage(null);
        setPreviewUrl('');
        setOrderData(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen pb-8">
            {/* Labubu Header */}
            <div className="labubu-header py-6 px-3 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-1 left-1 rotate-[-15deg] text-2xl opacity-30">🦷</div>
                <div className="absolute top-1 right-1 rotate-[15deg] text-2xl opacity-30">🦴</div>
                <div className="max-w-lg mx-auto relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-black mb-1 tracking-wide">OLA2 × LABUBU</h1>
                    <p className="text-labubu-cream opacity-90 font-bold text-xs sm:text-sm">🦷 頑皮幫手：自動識別訂單 🦷</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-labubu-pink"></div>
            </div>

            <div className="max-w-lg mx-auto px-3 py-4">
                {/* Upload Section */}
                {!selectedImage ? (
                    <div
                        className="labubu-card p-6 sm:p-8 cursor-pointer text-center group"
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <div className="text-5xl sm:text-6xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                        <p className="text-lg sm:text-xl font-black text-fur mb-1">上傳訂單圖片</p>
                        <p className="text-fur opacity-60 font-bold text-sm">點擊或拖放來開始 🐾</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    /* Preview Section */
                    <div className="labubu-card p-4 mb-6">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 border-4 border-white shadow-inner bg-white">
                            <img src={previewUrl} alt="訂單預覽" className="w-full h-full object-contain" />
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={resetImage}
                                className="flex-1 py-3 px-2 sm:px-4 bg-white text-fur border-2 border-fur rounded-2xl font-black hover:bg-gray-100 transition-all shadow-[0_4px_0px_#8B5E3C] active:translate-y-1 active:shadow-none text-sm sm:text-base"
                            >
                                🔄 重新
                            </button>
                            <button
                                onClick={analyzeImage}
                                disabled={isAnalyzing}
                                className="flex-[2] labubu-btn-primary py-3 px-2 sm:px-4 disabled:opacity-50 text-sm sm:text-base"
                            >
                                {isAnalyzing ? '⏳ 識別中...' : '🔍 開始識別'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border-4 border-red-400 rounded-2xl p-3 mb-6 text-center animate-bounce">
                        <p className="text-red-700 font-black text-sm">💢 {error} 💢</p>
                    </div>
                )}

                {/* Results Section */}
                {orderData && (
                    <div className="labubu-card p-6 animate-fade-in relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 text-6xl opacity-10 rotate-12">🦴</div>

                        <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-fur border-dashed">
                            <h2 className="text-2xl font-black text-fur">🦴 識別收穫</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-4 py-2 labubu-btn-secondary text-sm"
                                >
                                    {isEditing ? '💾 儲存' : '📝 修改'}
                                </button>
                                <button
                                    onClick={shareToApp}
                                    className="px-4 py-2 labubu-btn-primary text-sm"
                                >
                                    📤 分享
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 font-mono text-xs sm:text-sm">
                            {[
                                { label: '1. 店別', field: 'store' },
                                { label: '2. 時間', field: 'datetime' },
                                { label: '3. 代碼', field: 'itemCode', special: true },
                            ].map((item) => (
                                <div key={item.field} className="flex items-center gap-2">
                                    <span className="font-black text-fur w-16 sm:w-20 shrink-0 text-xs">{item.label}:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={(orderData as any)[item.field]}
                                            onChange={(e) => handleInputChange(item.field as any, e.target.value)}
                                            className="flex-1 labubu-input py-1 px-2 text-xs"
                                        />
                                    ) : (
                                        <span className={`font-bold ${item.special ? 'text-labubu-pink text-sm sm:text-base' : 'text-fur text-xs sm:text-sm'}`}>
                                            {item.field === 'itemCode' ? formatItemCode(orderData.itemCode, orderData.itemName) : (orderData as any)[item.field]}
                                        </span>
                                    )}
                                </div>
                            ))}

                            <div className="flex flex-col gap-1">
                                <span className="font-black text-fur text-xs">4. 品名:</span>
                                {isEditing ? (
                                    <textarea
                                        value={orderData.itemName}
                                        onChange={(e) => handleInputChange('itemName', e.target.value)}
                                        rows={2}
                                        className="labubu-input w-full text-xs"
                                    />
                                ) : (
                                    <div className="bg-white/50 p-2 rounded-xl border-2 border-fur/20 font-bold text-fur leading-relaxed text-xs sm:text-sm">
                                        {orderData.itemName}
                                    </div>
                                )}
                            </div>

                            {['bookingNo', 'invoiceNo'].map((field, idx) => (
                                ((orderData as any)[field] || isEditing) && (
                                    <div key={field} className="flex items-center gap-2">
                                        <span className="font-black text-fur w-16 sm:w-20 shrink-0 text-xs">{idx + 5}. {field === 'bookingNo' ? '訂編' : '發票'}:</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={(orderData as any)[field] || ''}
                                                onChange={(e) => handleInputChange(field as any, e.target.value)}
                                                className="flex-1 labubu-input py-1 px-2 text-xs"
                                                placeholder="選填"
                                            />
                                        ) : (
                                            <span className="font-bold text-fur opacity-80 text-xs sm:text-sm">{(orderData as any)[field]}</span>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Decor */}
                <div className="mt-8 text-center">
                    <div className="inline-block px-4 py-2 bg-fur/5 rounded-full border-2 border-dashed border-fur/20">
                        <p className="text-fur font-black text-xs">💡 確保照片清晰，Labubu 幫你搞定 🦷</p>
                    </div>
                    <div className="mt-4 flex justify-center gap-2 text-xs font-bold text-fur opacity-40">
                        <span className="text-xs">Design: WG德 🐸</span>
                        <span>•</span>
                        <a href="https://github.com/lalawgwg99/ola2" className="hover:text-labubu-pink underline text-xs">📦 GitHub</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
