import { RepositorioChamado } from '../dominio/RepositorioChamado';
import { RepositorioChamadoMemoria } from './RepositorioChamadoMemoria';
import { RepositorioChamadoSupabase, criarClienteSupabase } from './RepositorioChamadoSupabase';

export function criarRepositorioChamado(): RepositorioChamado {
    const usaSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    return usaSupabase
        ? new RepositorioChamadoSupabase(criarClienteSupabase())
        : new RepositorioChamadoMemoria();
}
