// ডাটাবেজ (LocalStorage) থেকে আগের ডাটা লোড করা
let budget = parseFloat(localStorage.getItem('pro_budget')) || 0;
let expenses = JSON.parse(localStorage.getItem('pro_expenses')) || [];

// বর্তমান বাংলা মাস ও বছর সেট করা
const options = { year: 'numeric', month: 'long' };
document.getElementById('currentDate').innerText = new Date().toLocaleDateString('bn-BD', options);

// স্ক্রিনের সব হিসাব-নিকাশ লাইভ আপডেট করার মূল ফাংশন
function updateUI() {
    // ১. মোট বাজেট স্ক্রিনে দেখানো
    document.getElementById('displayBudget').innerText = budget;
    
    // ২. মোট খরচের লাইভ যোগফল বের করা (যত বড় খরচই হোক এখানে সাথে সাথে যোগ হবে)
    let totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('displayTotalExpense').innerText = totalExpense;
    document.getElementById('footerTotalAmount').innerText = totalExpense;

    // ৩. অবশিষ্ট ব্যালেন্স হিসাব করা
    let remaining = budget - totalExpense;
    document.getElementById('remainingBalance').innerText = remaining;

    // মোট খরচের ফুটারটি লিস্টে ডাটা থাকলে দেখাবে, না থাকলে হাইড থাকবে
    const footer = document.getElementById('totalExpenseFooter');
    if (expenses.length > 0) {
        footer.classList.remove('hidden');
    } else {
        footer.classList.add('hidden');
    }

    // ৪. খরচের তালিকা স্ক্রিনে রেন্ডার করা
    const listContainer = document.getElementById('expenseList');
    if (expenses.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-400 text-center py-4 text-sm">এখনো কোনো খরচ লেখা হয়নি।</p>';
        return;
    }

    listContainer.innerHTML = expenses.map((exp, index) => `
        <div class="flex justify-between items-center p-3 text-sm hover:bg-gray-50 transition">
            <div>
                <p class="font-semibold text-gray-800">${exp.reason}</p>
                <p class="text-xs text-gray-400">${exp.date}</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold text-red-500">-${exp.amount} ৳</span>
                <button onclick="deleteExpense(${index})" class="text-gray-400 hover:text-red-600 text-xs delete-btn">❌</button>
            </div>
        </div>
    `).join('');
}

// বাজেট বারবার যোগ করার ফাংশন (যতবার লিখবেন ততবার আগেরটার সাথে প্লাস হবে)
function addBudget() {
    const budgetInput = document.getElementById('monthlyBudget').value;
    if(!budgetInput || parseFloat(budgetInput) <= 0) {
        return alert('দয়া করে সঠিক টাকার পরিমাণ লিখুন');
    }
    
    // আগের বাজেটের সাথে নতুন ইনপুট যোগ করা
    budget += parseFloat(budgetInput);
    localStorage.setItem('pro_budget', budget);
    document.getElementById('monthlyBudget').value = '';
    updateUI();
}

// নতুন খরচ লাইভ যোগ করার ফাংশন
function addExpense() {
    const reason = document.getElementById('expenseReason').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    if(!reason || !amount || amount <= 0) {
        return alert('দয়া করে খরচের খাত এবং সঠিক টাকার পরিমাণ লিখুন');
    }

    const newExpense = {
        reason: reason,
        amount: amount,
        date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })
    };

    expenses.push(newExpense);
    localStorage.setItem('pro_expenses', JSON.stringify(expenses));
    
    document.getElementById('expenseReason').value = '';
    document.getElementById('expenseAmount').value = '';
    updateUI();
}

// নির্দিষ্ট কোনো খরচ ডিলিট করা
function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem('pro_expenses', JSON.stringify(expenses));
    updateUI();
}

// কাস্টম ক্লিন পপ-আপ ওপেন
function clearAll() {
    document.getElementById('customModal').classList.remove('hidden');
}

// কাস্টম পপ-আপ ক্লোজ
function closeModal() {
    document.getElementById('customModal').classList.add('hidden');
}

// পপ-আপ থেকে নিশ্চিত করলে সব ডাটা এক ক্লিকে পরিষ্কার করা
function confirmClearAll() {
    localStorage.clear();
    budget = 0;
    expenses = [];
    updateUI();
    closeModal();
}

/// সম্পূর্ণ নতুন ও ১০০% কার্যকরী ডাউনলোড সিস্টেম
function downloadPDF() {
    // ডিলিট (❌) বোতামগুলো সাময়িকভাবে লুকিয়ে ফেলা
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => btn.style.display = 'none');

    // যে অংশটুকুর পিডিএফ লাগবে (printArea)
    const element = document.getElementById('printArea');

    // html2canvas ব্যবহার করে হিসাবের অংশটিকে সরাসরি ছবি (Image) বানিয়ে ডাউনলোড করা
    if (typeof html2canvas !== 'undefined') {
        html2canvas(element, { scale: 3, useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'মাসিক_হিসাব_বিবরণী.png'; // এটি সরাসরি আপনার ফোনে ইমেজ হিসেবে সেভ হবে
            link.href = canvas.toDataURL('image/png');
            link.click();

            // ডাউনলোড শেষে ডিলিট বাটনগুলো আবার স্ক্রিনে ফিরিয়ে আনা
            deleteButtons.forEach(btn => btn.style.display = 'inline-block');
        }).catch(err => {
            alert("ডাউনলোড ব্যর্থ হয়েছে, দয়া করে আবার চেষ্টা করুন।");
            deleteButtons.forEach(btn => btn.style.display = 'inline-block');
        });
    } else {
        // যদি কোনো কারণে লাইব্রেরি কাজ না করে, তবে ফোনের ডিফল্ট প্রিন্ট ট্রিকার করবে
        window.print();
        deleteButtons.forEach(btn => btn.style.display = 'inline-block');
    }
}



// অ্যাপ চালু হওয়ার সময় স্ক্রিন লোড করা
updateUI();
