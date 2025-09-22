import React, { useState } from 'react';
import TokenSelector from './TokenSelector';
import { TokenPrice } from '../services/api';
import ReactLoading from 'react-loading';

const SwapForm: React.FC = () => {
    const [fromToken, setFromToken] = useState<TokenPrice | null>(null);
    const [toToken, setToToken] = useState<TokenPrice | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSwap = () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            setError('');
            alert(`Swapped ${amount} ${fromToken?.currency} to ${amount * exchangeRate} ${toToken?.currency}`);
        }, 2000);
    };

    const exchangeRate = fromToken && toToken ? (fromToken.price / toToken.price).toFixed(4) : null;

    return (
        <div className="max-w-lg mx-auto p-6 border rounded-lg shadow-md bg-white">
            <h2 className="text-2xl font-bold mb-4 text-center">Currency Swap</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">From</label>
                <TokenSelector onTokenChange={setFromToken} />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">To</label>
                <TokenSelector onTokenChange={setToToken} />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={amount}
                    onChange={e=>setAmount(parseFloat(e.target.value))}
                />
            </div>

            {exchangeRate && (
                <p className="text-sm text-gray-600 mb-4">
                    Exchange Rate: 1 {fromToken?.currency} = {exchangeRate} {toToken?.currency}
                </p>
            )}
            {error && <p className="text-sm text-gray-600 mb-4">{error}</p>}
            <button
                className={`w-full py-2 px-4 text-white rounded ${
                    fromToken && toToken
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-300 cursor-not-allowed'
                }`}
                onClick={handleSwap}
                disabled={!fromToken || !toToken}
            >
                {loading ? (
                    <ReactLoading type="spin" color="#fff" height={24} width={24} />
                ) : (
                    'Swap'
                )}
            </button>
        </div>
    );
};

export default SwapForm;
