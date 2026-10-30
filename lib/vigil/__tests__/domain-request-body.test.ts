import { describe,it,expect } from 'vitest';
import { boundedDomainBody } from '../domain-engine/request-body';
describe('bounded domain request bodies',()=>{
 it('reads small UTF-8 JSON bodies',async()=>{expect(await boundedDomainBody(new Request('https://example.com',{method:'POST',body:'{"name":"café"}'}),100)).toBe('{"name":"café"}');});
 it('rejects declared oversized bodies before reading them',async()=>{await expect(boundedDomainBody(new Request('https://example.com',{method:'POST',headers:{'content-length':'1000000'},body:'{}'}),100)).rejects.toThrow('too large');});
 it('enforces actual streamed byte size without trusting content length',async()=>{await expect(boundedDomainBody(new Request('https://example.com',{method:'POST',body:'é'.repeat(60)}),100)).rejects.toThrow('too large');});
 it('handles an empty body',async()=>{expect(await boundedDomainBody(new Request('https://example.com'),100)).toBe('');});
});
