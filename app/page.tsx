"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Trash2, X, PlusCircle, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

// 型定義
interface Item {
  id: string;
  name: string;
  currentStock: number;
  dailyConsumption: number;
  unit: string;
  category: 'daily' | 'emergency';
}

export default function RollingStockApp() {
  const [activeTab, setActiveTab] = useState<'daily' | 'emergency'>('daily');
  const [items, setItems] = useState<Item[]>([]);
  const [thresholds, setThresholds] = useState({ daily: 7, emergency: 30 });
  const [isAdding, setIsAdding] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', stock: '', consumption: '', unit: '個' });

  useEffect(() => {
    // 内部キーをv6に更新
    const savedItems = localStorage.getItem('rs-v6-items');
    const savedDate = localStorage.getItem('rs-v6-last-date');
    const savedThresholds = localStorage.getItem('rs-v6-thresholds');
    const today = new Date().toISOString().split('T')[0];
    
    const defaultItems: Item[] = [
      { id: 'default-1', name: '玄米(5kg)', currentStock: 1, dailyConsumption: 0.1, unit: '袋', category: 'daily' },
      { id: 'default-2', name: '水(500ml)', currentStock: 24, dailyConsumption: 2, unit: '本', category: 'emergency' }
    ];

    let currentItems = savedItems ? JSON.parse(savedItems) : defaultItems;

    if (savedDate && savedDate !== today) {
      const diffTime = Math.abs(new Date(today).getTime() - new Date(savedDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      currentItems = currentItems.map((item: Item) => ({
        ...item,
        currentStock: Math.max(0, item.currentStock - (item.dailyConsumption * diffDays))
      }));
    }

    setItems(currentItems);
    if (savedThresholds) setThresholds(JSON.parse(savedThresholds));
    localStorage.setItem('rs-v6-last-date', today);
  }, []);

  useEffect(() => {
    localStorage.setItem('rs-v6-items', JSON.stringify(items));
    localStorage.setItem('rs-v6-thresholds', JSON.stringify(thresholds));
  }, [items, thresholds]);

  const filteredItems = items.filter(item => item.category === activeTab);

  const updateStock = (id: string, amount: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, currentStock: Math.max(0, Number(item.currentStock) + amount) } : item
    ));
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.stock || !newItem.consumption) return;

    const item: Item = {
      id: Date.now().toString(),
      name: newItem.name,
      currentStock: parseFloat(newItem.stock),
      dailyConsumption: parseFloat(newItem.consumption),
      unit: newItem.unit,
      category: activeTab
    };

    setItems([...items, item]);
    setNewItem({ name: '', stock: '', consumption: '', unit: '個' });
    setIsAdding(false);
  };

  const deleteItem = (id: string) => {
    if (confirm('このアイテムを削除しますか？')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id);
    const tabItems = items.filter(item => item.category === activeTab);
    const indexInTab = tabItems.findIndex(item => item.id === id);

    if (direction === 'up' && indexInTab === 0) return;
    if (direction === 'down' && indexInTab === tabItems.length - 1) return;

    const targetInTab = tabItems[indexInTab + (direction === 'up' ? -1 : 1)];
    const targetIndex = items.findIndex(item => item.id === targetInTab.id);

    const newItems = [...items];
    [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
    setItems(newItems);
  };

  const getStatus = (item: Item) => {
    const remainingDays = item.currentStock / item.dailyConsumption;
    return remainingDays < thresholds[activeTab] ? 'low' : 'ok';
  };

  const copyShoppingList = () => {
    const lowStockItems = filteredItems.filter(item => getStatus(item) === 'low');
    const text = lowStockItems.map(item => `・${item.name} (${item.unit})`).join('\n');
    const categoryName = activeTab === 'daily' ? '日用品' : '防災備蓄';
    navigator.clipboard.writeText(`【${categoryName} 要補充リスト】\n${text}`);
    alert('リストをコピーしました');
  };

  return (
    <div className="min-h-screen bg-[#fdfcf0] text-stone-800 p-4 font-sans pb-32">
      <header className="max-w-md mx-auto mb-4">
        <div className="flex justify-between items-end border-b-2 border-stone-300 pb-2">
          <h1 className="text-xl font-bold tracking-tight text-stone-700">ローリングストックリスト</h1>
          <div className="flex gap-4">
            <button onClick={() => setIsSorting(!isSorting)} className={`${isSorting ? 'text-amber-600' : 'text-stone-400'}`}>
              <ArrowUpDown size={22} />
            </button>
            <button onClick={() => setIsAdding(!isAdding)} className="text-stone-500 hover:text-stone-800">
              {isAdding ? <X size={24} /> : <PlusCircle size={24} />}
            </button>
          </div>
        </div>
        
        <div className="flex mt-4 bg-stone-200/50 rounded-lg p-1">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'daily' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}>日用品</button>
          <button onClick={() => setActiveTab('emergency')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'emergency' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}>防災備蓄</button>
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] text-stone-400 italic">
          <span>記録：ブラウザ内保存</span>
          <div className="flex items-center gap-1">
            <span className="not-italic font-bold text-stone-600">期限: </span>
            <select className="bg-transparent border-none focus:ring-0 p-0 text-stone-700 font-bold text-[10px]" value={thresholds[activeTab]} onChange={(e) => setThresholds({...thresholds, [activeTab]: parseInt(e.target.value)})}>
              <option value={7}>1週間前</option>
              <option value={14}>2週間前</option>
              <option value={30}>1ヶ月前</option>
              <option value={90}>3ヶ月前</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto space-y-4">
        {isAdding && (
          <form onSubmit={addItem} className="bg-white p-6 rounded-lg border-2 border-stone-200 shadow-sm space-y-4 mb-4">
            <input placeholder="品名 (例: お米)" className="w-full border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
            <div className="flex gap-4">
              <input placeholder="在庫量" type="number" step="0.1" className="w-1/2 border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} />
              <input 
                placeholder="単位" 
                className="w-1/2 border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500" 
                value={newItem.unit} 
                onChange={e => setNewItem({...newItem, unit: e.target.value.replace(/[0-9]/g, '')})} 
              />
            </div>
            <input placeholder="1日の消費量 (例: 0.5)" type="number" step="0.1" className="w-full border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500" value={newItem.consumption} onChange={e => setNewItem({...newItem, consumption: e.target.value})} />
            <button type="submit" className="w-full bg-stone-800 text-white py-2 rounded-md font-bold text-sm">追加する</button>
          </form>
        )}

        <div className="space-y-4">
          {filteredItems.map(item => {
            const isLow = getStatus(item) === 'low';
            return (
              <div key={item.id} className="relative group bg-white border border-stone-200 shadow-sm rounded-r-md">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 opacity-60"></div>
                <div className="p-4 pl-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      {isSorting && (
                        <div className="flex flex-col gap-2 mr-2">
                          <button onClick={() => moveItem(item.id, 'up')} className="text-stone-300 active:text-stone-800"><ArrowUp size={16} /></button>
                          <button onClick={() => moveItem(item.id, 'down')} className="text-stone-300 active:text-stone-800"><ArrowDown size={16} /></button>
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold text-stone-700">{item.name}</h2>
                        <p className="text-[10px] text-stone-400 font-semibold">1日の消費目安: {item.dailyConsumption} {item.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => deleteItem(item.id)} className="text-stone-300 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                      {isLow ? <AlertCircle className="text-red-500 w-5 h-5 animate-pulse" /> : <CheckCircle2 className="text-emerald-500 w-5 h-5" />}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-3xl font-mono font-medium text-stone-800">
                      {Math.floor(item.currentStock * 10) / 10} <span className="text-xs font-sans text-stone-400">{item.unit}</span>
                    </div>
                    {!isSorting && (
                      <div className="flex items-center gap-1 bg-stone-50 rounded-full p-1 border border-stone-100">
                        <button onClick={() => updateStock(item.id, -1)} className="p-2 hover:bg-white rounded-full"><Minus size={18}/></button>
                        <div className="w-px h-4 bg-stone-200"></div>
                        <button onClick={() => updateStock(item.id, 1)} className="p-2 hover:bg-white rounded-full"><Plus size={18}/></button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-[10px] text-stone-400 whitespace-nowrap">消費ペース</span>
                    <input 
                      type="range" min="0.01" max="5" step="0.01" 
                      value={item.dailyConsumption}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        // 0.1より大きい場合は0.1刻みに丸め、それ以下は0.01刻みのままにする
                        const snappedVal = val > 0.1 
                          ? Math.round(val * 10) / 10 
                          : Math.round(val * 100) / 100;
                        setItems(items.map(i => i.id === item.id ? {...i, dailyConsumption: snappedVal} : i));
                      }}
                      className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <button onClick={copyShoppingList} className="w-full flex items-center justify-center gap-3 bg-stone-800 text-white py-4 rounded-xl shadow-2xl hover:bg-stone-700 active:scale-95 transition-all">
          <ShoppingCart size={20} />
          <span className="font-bold tracking-widest text-sm uppercase">買い物リストを作成</span>
        </button>
      </div>
    </div>
  );
}