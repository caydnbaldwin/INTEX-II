import { useState } from 'react';
import axios from 'axios';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import CookieConsentBanner from './components/CookieConsentBanner';

// NOTE on DOMPurify: installed for IS 414 data sanitization requirement.
// Any place user-supplied content is rendered with dangerouslySetInnerHTML,
// wrap it: <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
// React escapes all JSX string output by default — no dangerouslySetInnerHTML
// means no XSS risk from normal rendering.

const API = import.meta.env.VITE_API_BASE_URL as string;

type DbCheckResult = Record<string, unknown>;

function App() {
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [dbResults, setDbResults] = useState<DbCheckResult | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  async function verifyConnection() {
    setConnectionMessage(null);
    setConnectionError(false);
    try {
      const res = await axios.get<{ message: string }>(`${API}/api/health`);
      setConnectionMessage(res.data.message);
    } catch {
      setConnectionMessage('Failed to connect to backend.');
      setConnectionError(true);
    }
  }

  async function verifyDatabase() {
    setDbResults(null);
    setDbLoading(true);
    try {
      const res = await axios.get<DbCheckResult>(`${API}/api/dbcheck`);
      setDbResults(res.data);
    } catch {
      setDbResults({ error: 'Failed to reach backend.' });
    } finally {
      setDbLoading(false);
    }
  }

  const tableCount = dbResults
    ? Object.values(dbResults).filter(
        (v) => typeof v !== 'string' || !v.startsWith('error')
      ).length
    : 0;
  const totalTables = 17;
  const allGreen = tableCount === totalTables;

  return (
    <CookieConsentProvider>
      <AuthProvider>
        <div
          style={{
            maxWidth: 900,
            margin: '40px auto',
            fontFamily: 'sans-serif',
            padding: '0 20px',
          }}
        >
          <h1>INTEX II — Pipeline Verification</h1>

          <section style={{ marginBottom: 32 }}>
            <button onClick={verifyConnection} style={btnStyle}>
              Verify Connection to Backend
            </button>
            {connectionMessage && (
              <p
                style={{
                  color: connectionError ? 'red' : 'green',
                  marginTop: 8,
                  fontWeight: 'bold',
                }}
              >
                {connectionMessage}
              </p>
            )}
          </section>

          <section>
            <button
              onClick={verifyDatabase}
              disabled={dbLoading}
              style={btnStyle}
            >
              {dbLoading ? 'Checking...' : 'Verify Database Connection'}
            </button>

            {dbResults && (
              <>
                <p
                  style={{
                    marginTop: 16,
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: allGreen ? 'green' : 'red',
                  }}
                >
                  {tableCount}/{totalTables} tables connected
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  {Object.entries(dbResults).map(([table, row]) => {
                    const isError =
                      typeof row === 'string' && row.startsWith('error');
                    const isEmpty = row === 'empty table';
                    return (
                      <div
                        key={table}
                        style={{
                          border: `2px solid ${isError ? 'red' : 'green'}`,
                          borderRadius: 8,
                          padding: 12,
                          background: isError
                            ? '#fff5f5'
                            : isEmpty
                              ? '#fffbe6'
                              : '#f0fff4',
                        }}
                      >
                        <strong
                          style={{
                            textTransform: 'uppercase',
                            fontSize: 12,
                            letterSpacing: 1,
                          }}
                        >
                          {table.replace(/_/g, ' ')}
                        </strong>
                        {isError || isEmpty ? (
                          <p
                            style={{
                              color: isError ? 'red' : '#aaa',
                              fontSize: 13,
                              marginTop: 4,
                            }}
                          >
                            {String(row)}
                          </p>
                        ) : (
                          <pre
                            style={{
                              fontSize: 10,
                              marginTop: 8,
                              overflow: 'auto',
                              maxHeight: 120,
                            }}
                          >
                            {JSON.stringify(row, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        {/* GDPR cookie consent banner — shows on first visit, persists accept/reject choice */}
        <CookieConsentBanner />
      </AuthProvider>
    </CookieConsentProvider>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '10px 24px',
  fontSize: 15,
  cursor: 'pointer',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: 'white',
};

export default App;
