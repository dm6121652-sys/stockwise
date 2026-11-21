"use client";

import { FormEvent, useEffect, useState } from "react";
import { Glyph } from "@/components/brand";
import { getShopContext, inviteCloudEmployee, loadCloudInvites, loadCloudTeam } from "@/lib/cloud";

type Member = { id: string; name: string; email: string; role: string };
type Invite = { email: string; invite_code: string };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]); const [invites, setInvites] = useState<Invite[]>([]);
  const [shopId, setShopId] = useState(""); const [canInvite, setCanInvite] = useState(false);
  const [show, setShow] = useState(false); const [email, setEmail] = useState(""); const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const shop = await getShopContext();
        if (!shop) throw new Error("No shop is linked to this account.");
        const [team, pending] = await Promise.all([loadCloudTeam(shop.id), shop.role === "owner" ? loadCloudInvites(shop.id) : Promise.resolve([])]);
        if (alive) {
          setShopId(shop.id); setCanInvite(shop.role === "owner");
          setMembers(team.map((member: { name: string; email: string; role: string }, index: number) => ({ id: `${index}-${member.email}`, name: member.name, email: member.email, role: member.role === "owner" ? "Owner" : "Sales staff" })));
          setInvites(pending); setLoadError("");
        }
      } catch (error) {
        if (alive) setLoadError(error instanceof Error ? error.message : "Could not load your team. Check your connection and try again.");
      }
    }
    void load(); return () => { alive = false; };
  }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!shopId || !canInvite) { setMessage("Only the shop owner can invite staff."); return; }
    setBusy(true); setMessage("");
    try {
      const code = await inviteCloudEmployee(shopId, email.trim());
      const pending = await loadCloudInvites(shopId); setInvites(pending);
      setMessage(`Invite created for ${email.trim()}. Share this code: ${code}`);
      setEmail(""); setShow(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create this invite."); }
    finally { setBusy(false); }
  }

  return <><div className="page-heading"><div><span className="eyebrow">PEOPLE & ACCESS</span><h1>Your team</h1><p>Give your staff the access they need to keep sales moving.</p></div>{canInvite && <button className="button" onClick={() => setShow(!show)}><Glyph name="plus" size={17}/> Add team member</button>}</div>{loadError && <p className="form-message" role="alert">{loadError}</p>}{message && <p className="inline-success" role="status">{message}</p>}<div className="team-info"><div><b>Owner</b><span>Can manage products, staff, stock adjustments, and reports.</span></div><div><b>Sales staff</b><span>Can record sales and check product availability.</span></div></div>{show && <form className="panel invite-form" onSubmit={invite}><div className="form-title"><div><h2>Add a team member</h2><p>We’ll create an invite code they can use to join this shop.</p></div><button type="button" className="close-button" onClick={() => setShow(false)} aria-label="Close form">×</button></div><div className="product-form-fields"><label>Email address<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="employee@example.com"/></label></div><div className="form-actions"><button type="button" className="outline-button" onClick={() => setShow(false)}>Cancel</button><button className="button" disabled={busy}>{busy ? "Creating invite…" : "Create invite"}</button></div></form>}<section className="panel team-panel"><div className="table-toolbar"><div><h2>Members <span className="count-badge">{members.length}</span></h2><p>People with access to this shop.</p></div><span className="role-legend"><i/> Role-based access</span></div><div className="team-list">{members.map((member, index) => <div className="team-row" key={member.id}><span className={`team-initial initial-${index % 3}`}>{member.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><span className="team-person"><b>{member.name}</b><small>{member.email}</small></span><span className={member.role === "Owner" ? "role-badge owner-role" : "role-badge"}>{member.role}</span><span className="member-status"><i/> Active</span></div>)}{invites.map(invite => <div className="team-row" key={invite.invite_code}><span className="team-initial initial-2">{invite.email.slice(0, 2).toUpperCase()}</span><span className="team-person"><b>{invite.email}</b><small>Invite code: {invite.invite_code}</small></span><span className="role-badge">Invite pending</span><button className="copy-code" onClick={() => void navigator.clipboard?.writeText(invite.invite_code)}>Copy code</button></div>)}{!members.length && !invites.length && !loadError && <div className="empty-panel">No team members are linked to this shop yet.</div>}</div></section></>;
}
