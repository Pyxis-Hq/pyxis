"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt, NativeSelect, Notice, PageHeader, Panel, Skeleton, Status } from "@/components/pyxis/ui";
import {
  useAddMemberMutation, useLogoutMutation, useMeQuery, useMembersQuery, useProjectQuery, useRemoveMemberMutation, useUpdateProjectMutation,
} from "@/lib/api";

const ROLES = [
  ["admin", "Admin", "Manage settings and members, plus everything below."],
  ["developer", "Developer", "Create and revoke keys, add sites, read all data."],
  ["analyst", "Analyst", "Read all data."],
  ["viewer", "Viewer", "Read all data."],
] as const;
const RANK: Record<string, number> = { viewer: 1, analyst: 2, developer: 3, admin: 4, owner: 5 };

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: me } = useMeQuery();
  const { data: project, isLoading } = useProjectQuery(id);
  const { data: members } = useMembersQuery(id);
  const [update, { isLoading: saving, isSuccess: saved, error: saveErr }] = useUpdateProjectMutation();
  const [addMember, { isLoading: adding, error: addErr }] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [logout] = useLogoutMutation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("developer");
  const [confirm, setConfirm] = useState<string | null>(null);
  const canAdmin = (RANK[project?.role ?? ""] ?? 0) >= RANK.admin;

  useEffect(() => {
    if (project) { setName(project.name); setDescription(project.description ?? ""); }
  }, [project]);

  const addMsg = (addErr as { data?: { message?: string } } | undefined)?.data?.message;

  return (
    <>
      <PageHeader title="Settings" description="Project details, who can access it, and your account." />

      <div className="grid gap-6">
        <Panel title="Project">
          {isLoading ? <Skeleton className="h-24" /> : (
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(e) => { e.preventDefault(); update({ id, name, description: description || null }); }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="n">Name</Label>
                <Input id="n" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required disabled={!canAdmin} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d">Description</Label>
                <Input id="d" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What this project measures" disabled={!canAdmin} />
              </div>
              {saveErr && <Notice tone="bad">Could not save. The name must be 2 to 100 characters.</Notice>}
              {saved && !saveErr && <Notice tone="ok">Saved.</Notice>}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!canAdmin || saving}>{saving ? "Saving…" : "Save changes"}</Button>
                {!canAdmin && <span className="text-xs text-muted-foreground">Only admins and owners can edit the project.</span>}
              </div>
            </form>
          )}
        </Panel>

        <Panel title="Team" flush aside="People with access to this project's data">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Wallet</TableHead><TableHead>Role</TableHead><TableHead>Added</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {(members?.members ?? []).map((m) => (
                <TableRow key={m.userId}>
                  <TableCell className="font-mono text-xs" title={m.account}>{fmt.short(m.account)} {m.you && <span className="ml-1.5 font-sans text-muted-foreground">(you)</span>}</TableCell>
                  <TableCell className="capitalize"><span className={m.role === "owner" ? "font-medium" : "text-muted-foreground"}>{m.role}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground tnum">{fmt.when(m.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {canAdmin && m.role !== "owner" && (confirm === m.userId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Button variant="destructive" size="xs" onClick={() => { removeMember({ id, userId: m.userId }); setConfirm(null); }}>Remove</Button>
                        <Button variant="ghost" size="xs" onClick={() => setConfirm(null)}>Cancel</Button>
                      </span>
                    ) : (
                      <Button variant="ghost" size="xs" onClick={() => setConfirm(m.userId)}><Trash2 /> Remove</Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {canAdmin && (
            <form
              className="grid gap-3 border-t border-border p-4 md:grid-cols-[1fr_11rem_auto] md:items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await addMember({ id, account, role }).unwrap().catch(() => null);
                if (r) setAccount("");
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="acct">Add a teammate by Stellar public key</Label>
                <Input id="acct" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="G…" className="font-mono text-xs" required autoComplete="off" spellCheck={false} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="role">Role</Label>
                <NativeSelect id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </NativeSelect>
              </div>
              <Button type="submit" disabled={adding}><UserPlus /> {adding ? "Adding…" : "Add"}</Button>
              {addErr && <div className="md:col-span-3"><Notice tone="bad">{addMsg ?? "Could not add that person."}</Notice></div>}
              <p className="text-xs text-muted-foreground md:col-span-3">
                {ROLES.find(([v]) => v === role)?.[2]} They sign in with that wallet; no email is involved.
              </p>
            </form>
          )}
        </Panel>

        <Panel title="Your account">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Signed in with</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{me?.user?.account}</p>
            </div>
            <Button variant="outline" onClick={async () => { await logout(); router.replace("/"); }}><LogOut /> Sign out</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
