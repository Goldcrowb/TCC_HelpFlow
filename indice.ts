import { RepositorioChamado } from '../dominio/RepositorioChamado';
import { RepositorioChamadoMemoria } from './RepositorioChamadoMemoria';
import { RepositorioChamadoSupabase, criarClienteSupabase } from './RepositorioChamadoSupabase';

export function criarRepositorioChamado(): RepositorioChamado {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return new RepositorioChamadoSupabase(criarClienteSupabase());
    }
    if (process.env.NODE_ENV === 'production' && process.env.DEMO_MEMORY_MODE !== '1') {
        throw new Error('Produção requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Não use banco em memória na apresentação online.');
    }
    return new RepositorioChamadoMemoria();
}
