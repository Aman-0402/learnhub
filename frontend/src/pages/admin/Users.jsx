import { useMemo, useState } from "react";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { manage } from "../../lib/manage.js";
import { useAuth } from "../../lib/auth.jsx";
import { FormError } from "../../components/admin/Kit.jsx";
import { Card } from "../../components/PageHeader.jsx";
import { EmptyState } from "../../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../../components/States.jsx";

const ROLES = [["", "All roles"], ["student", "Student"], ["staff", "Staff"], ["superadmin", "Super admin"]];
const ROLE_LABEL = { student: "Student", staff: "Staff", superadmin: "Super admin" };

const dateStr = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

function RoleBadge({ role }) {
  const cls = role === "superadmin" ? "bg-brand-100 text-brand-strong" : role === "staff" ? "bg-slate-900 text-slate-50" : "bg-slate-100 text-slate-700";
  return <span className={`tag ${cls}`}>{ROLE_LABEL[role]}</span>;
}

function RoleMenu({ u, me, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isSelf = u.id === me.id;
  const setRole = async (role) => {
    setBusy(true); setErr("");
    try { await manage.action("users", u.id, "set-role", { role }); onChanged(); }
    catch (err) { setErr(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <select
        className="field w-auto !min-h-9 py-1 text-sm"
        value={u.role}
        disabled={busy || (isSelf && u.role === "superadmin")}
        onChange={(e) => setRole(e.target.value)}
        aria-label={`Change role for ${u.full_name}`}
        title={isSelf && u.role === "superadmin" ? "You cannot remove your own super admin access." : undefined}
      >
        {["student", "staff", "superadmin"].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      {isSelf && u.role === "superadmin" && <p className="text-xs text-slate-600">You cannot change your own role.</p>}
      {err && <div className="max-w-xs"><FormError>{err}</FormError></div>}
    </div>
  );
}

export default function Users() {
  useTitle("Users", { noindex: true });
  const { user: me } = useAuth();
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const params = useMemo(() => ({ role, q }), [role, q]);
  const list = useFetch(() => manage.all("users", params), [role, q]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold">Users</h1>
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="field w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          {ROLES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <input className="field w-auto flex-1" type="search" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
      </div>
      {list.loading && <ListSkeleton />}
      {list.error && <ErrorState message={list.error} status={list.status} onRetry={list.reload} />}
      {list.data && (list.data.length === 0
        ? <EmptyState title="No users match">Try a different filter or search.</EmptyState>
        : (
          <Card className="overflow-x-auto !p-0">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Users</caption>
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="px-5 py-3 font-medium">Role</th>
                  <th scope="col" className="px-5 py-3 font-medium">Joined</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.data.map((u) => (
                  <tr key={u.id}>
                    <th scope="row" className="px-5 py-3 text-left font-normal">
                      <p className="font-medium">{u.full_name}{u.id === me.id && <span className="text-slate-600"> (you)</span>}</p>
                      <p className="text-xs text-slate-600">{u.email}</p>
                    </th>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3 text-slate-600">{dateStr(u.date_joined)}</td>
                    <td className="px-5 py-3 text-right">
                      {me.role === "superadmin"
                        ? <RoleMenu u={u} me={me} onChanged={list.reload} />
                        : <span className="text-slate-500">Super admin only</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
    </div>
  );
}
