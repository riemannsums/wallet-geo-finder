import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

const SOLANA_RPC = process.env.SOLANA_RPC;

export async function POST(req: NextRequest) {
  if (!SOLANA_RPC) {
    return NextResponse.json({ error: 'RPC endpoint not configured' }, { status: 500 });
  }

  try {
    const { address } = await req.json();
    
    if (!address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const pubkey = new PublicKey(address);
    
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });

    return NextResponse.json({ 
      signatures,
      total: signatures.length 
    });

  } catch (error: any) {
    if (error.message.includes('invalid public key')) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }
    return NextResponse.json({ error: `Failed to fetch transactions: ${error.message}` }, { status: 500 });
  }
}
