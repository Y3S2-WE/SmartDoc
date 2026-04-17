const fs = require('fs');
const file = '/Users/shiranthadissanayake/Documents/GitHub/SmartDoc/frontend/src/pages/Admin-Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// conflict 1
content = content.replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> a197849[^\n]*\n/, 
`  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Upload,
  UserCog,
  UsersRound\n`);

// conflict 2
content = content.replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> a197849[^\n]*\n/,
`  const [activeTab, setActiveTab] = useState(TABS.DOCTORS);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {/* Tab Switcher */}
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setActiveTab(TABS.DOCTORS)}
          className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all \${
            activeTab === TABS.DOCTORS
              ? 'bg-lake text-white shadow-md'
              : 'border border-lake/20 bg-white/60 text-ink/70 hover:bg-lake/10 hover:text-lake'
          }\`}
        >
          <BarChart3 size={15} /> Platform Overview
        </button>
        <button
          onClick={() => setActiveTab(TABS.DOCUMENTS)}
          className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all \${
            activeTab === TABS.DOCUMENTS
              ? 'bg-lake text-white shadow-md'
              : 'border border-lake/20 bg-white/60 text-ink/70 hover:bg-lake/10 hover:text-lake'
          }\`}
        >
          <Brain size={15} /> AI Health Documents
        </button>
      </div>

      {activeTab === TABS.DOCTORS ? (
        <PlatformOverviewTab session={session} />
      ) : (
        <HealthDocumentsTab session={session} />
      )}
    </div>
  );
}

// ─── Platform Overview Tab ──────────────────────────────────────────────────────

function PlatformOverviewTab({ session }) {
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [financialTransactions, setFinancialTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');\n`);

// conflict 3
content = content.replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> a197849[^\n]*\n/,
`      const [usersResponse, overviewResponse, financialResponse] = await Promise.all([
        axios.get(\`\${AUTH_API_URL}/admin/users\`, { headers: authHeader }),
        axios.get(\`\${AUTH_API_URL}/admin/overview\`, { headers: authHeader }),
        axios.get(\`\${AUTH_API_URL}/admin/financial-transactions\`, { headers: authHeader })
      ]);

      const loadedUsers = usersResponse.data.users || [];
      const loadedOverview = overviewResponse.data.overview || null;
      const loadedFinancial = financialResponse.data || null;
      const loadedTransactions = loadedFinancial?.transactions || loadedFinancial?.items || [];

      setUsers(loadedUsers);
      setOverview(loadedOverview);
      setFinancialData(loadedFinancial);
      setFinancialTransactions(Array.isArray(loadedTransactions) ? loadedTransactions : []);\n`);

// conflict 4
content = content.replace(/<<<<<<< HEAD\s+([\s\S]*?)=======\s+[\s\S]*?>>>>>>> a197849[^\n]*\n/, (match, p1) => {
  const correctedHead = p1.replace(/<\/div>\n\s*\);\n\}/, '</>\n  );\n}');
  return correctedHead;
});

fs.writeFileSync(file, content);
console.log('Merge conflicts resolved successfully');
