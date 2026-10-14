'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {requireOrgContextOrThrow,assertOrgRole} from '@/lib/vigil/auth/session';
import {createClient} from '@/lib/supabase/server';
import {saveCollection} from '@/lib/vigil/content/service';
import {toActionError,type ActionResult} from '@/lib/vigil/auth/errors';
export async function saveContentCollection(id:string,revision:number,records:unknown,intent:'draft'|'publish'|'unpublish'|'trash'):Promise<ActionResult<{revision:number}>>{
 try{const ctx=await requireOrgContextOrThrow();await assertOrgRole(ctx,['owner','manager']);
  const result=await saveCollection(await createClient(),ctx.organization.id,ctx.user.id,z.string().uuid().parse(id),z.number().int().positive().parse(revision),records,z.enum(['draft','publish','unpublish','trash']).parse(intent));
  revalidatePath('/dashboard/content');return {ok:true,data:result};
 }catch(error){return toActionError(error);}
}
