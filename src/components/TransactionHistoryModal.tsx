import { useProgressStore } from '../store/useProgressStore';
import { X, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionHistoryModal({ isOpen, onClose }: TransactionHistoryModalProps) {
  const { transactions = [], coins } = useProgressStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border-2 sm:border-4 border-sky-100 flex flex-col max-h-[85vh] my-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <Coins className="text-amber-500 w-6 h-6 sm:w-7 sm:h-7" />
            Coin History
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 text-center border-2 border-amber-100">
          <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider mb-1">
            Current Balance
          </p>
          <p className="text-2xl sm:text-4xl font-black text-amber-500">{coins} Coins</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2 sm:space-y-3">
          {transactions.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-6 sm:py-8 text-xs sm:text-sm">
              No transactions yet. Play some games!
            </p>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-100 gap-2"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${
                      t.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {t.type === 'earn' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 leading-tight text-xs sm:text-sm truncate">
                      {t.reason}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">
                      {new Date(t.date).toLocaleDateString()}{' '}
                      {new Date(t.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div
                  className={`font-black text-base sm:text-lg shrink-0 ${
                    t.type === 'earn' ? 'text-green-500' : 'text-rose-500'
                  }`}
                >
                  {t.type === 'earn' ? '+' : '-'}
                  {t.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
