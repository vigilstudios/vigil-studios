import { publishedExpressVariant } from "@/lib/vigil/express/library";
import { expressHtml } from "@/lib/vigil/express/export";
export async function GET(_request: Request,{params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const draft=await publishedExpressVariant(slug);
 if(!draft)return new Response("This variant is unavailable.",{status:404});
 if(draft.kind === "site"&&!draft.engineVersion)return new Response("Preview is being prepared.",{status:503});
 return new Response(expressHtml(draft,`/design-engine-runtime/${draft.engineVersion}`,true,`/express-preview/${slug}`),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
}
