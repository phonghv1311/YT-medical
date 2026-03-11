import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'howto' | 'effects'>('description');

  // Mock product - in real app fetch by id
  const product = {
    id: id ?? '1',
    name: 'Amoxicillin 500mg',
    manufacturer: 'eHealthCare Pharma Ltd.',
    price: 24.99,
    inStock: true,
    description: 'Amoxicillin is a penicillin antibiotic that fights bacteria. It is used to treat many different types of infection caused by bacteria, such as tonsillitis, bronchitis, pneumonia, and infections of the ear, nose, throat, skin, or urinary tract.',
    howToUse: 'Take as directed by your doctor. Usually 2-3 times daily.',
    sideEffects: 'May cause nausea, diarrhea, or allergic reactions in some patients.',
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Pharmacy</h1>
        <Link to="/customer/pharmacy/cart" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cart">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </Link>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="aspect-square max-w-sm mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
          <span className="text-6xl">💊</span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          {product.inStock && <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">In stock</span>}
        </div>
        <p className="text-sm text-gray-600">Manufacturer: {product.manufacturer}</p>
        <p className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 font-medium">−</button>
            <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">+</button>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          {(['description', 'howto', 'effects'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)} className={`pb-3 text-sm font-medium capitalize ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
              {t === 'howto' ? 'How to use' : t === 'effects' ? 'Side Effects' : 'Description'}
            </button>
          ))}
        </div>
        <p className="text-gray-600 text-sm">
          {activeTab === 'description' && product.description}
          {activeTab === 'howto' && product.howToUse}
          {activeTab === 'effects' && product.sideEffects}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <button type="button" className="py-3 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Add to Cart
          </button>
          <Link to="/customer/pharmacy/cart" className="py-3 rounded-xl bg-blue-600 text-white font-semibold text-center flex items-center justify-center gap-2">
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}
