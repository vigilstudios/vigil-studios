export type DraftGuard={when:boolean;busy?:boolean;save:()=>Promise<boolean>;publish:()=>Promise<boolean>;discard:()=>void;release:()=>void};
/** A failed save never releases a guard or permits navigation. */
export async function applyDraftDecision(guards:DraftGuard[],intent:'draft'|'publish'|'discard'):Promise<boolean>{
 if(guards.some(guard=>guard.busy))throw new Error('Finish the current upload or save before leaving.');
 for(const guard of guards){if(intent==='discard')guard.discard();else if(!await (intent==='draft'?guard.save():guard.publish()))return false;}
 for(const guard of guards)guard.release();return true;
}
