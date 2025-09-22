import axios from "axios";

export interface TokenPrice {
    date: string;
    currency: string;
    price: number;
}
export const fetchTokenPrices = async (): Promise<TokenPrice[]> => {
    return (await axios.get('https://interview.switcheo.com/prices.json')).data;
}