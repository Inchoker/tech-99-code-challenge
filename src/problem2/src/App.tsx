import React, { useState } from 'react'
import './App.css'
import SwapForm from "./components/SwapForm.tsx";

const App: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <SwapForm />
    </div>
);

export default App
