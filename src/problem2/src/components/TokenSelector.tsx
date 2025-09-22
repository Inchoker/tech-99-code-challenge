import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { fetchTokenPrices, TokenPrice } from '../services/api';

interface TokenSelectorProps {
    onTokenChange: (token: TokenPrice) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ onTokenChange }) => {
    const [tokens, setTokens] = useState<TokenPrice[]>([]);

    useEffect(() => {
        const loadTokens = async () => {
            const data = await fetchTokenPrices();
            setTokens(data);
        };
        loadTokens();
    }, []);

    const options = tokens.map((token) => ({
        value: token.currency,
        label: (
            <div className="flex items-center">
                <img
                    src={`https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${token.currency}.svg`}
                    alt={token.currency}
                    className="w-5 h-5 mr-2"
                />
                {token.currency}
            </div>
        ),
        token,
    }));

    return (
        <Select
            options={options}
            onChange={(selectedOption: any) => {
                if (selectedOption?.token) {
                    onTokenChange(selectedOption.token);
                }
            }}
        />
    );
};

export default TokenSelector;
