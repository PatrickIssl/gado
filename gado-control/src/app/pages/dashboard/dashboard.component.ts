import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VacaService } from '../../core/services/vaca.service';
import { BezerroService } from '../../core/services/bezerro.service';
import { InseminacaoService } from '../../core/services/inseminacao.service';
import { StatusVaca, Vaca } from '../../core/models/vaca.model';
import { Bezerro } from '../../core/models/bezerro.model';
import { Inseminacao } from '../../core/models/inseminacao.model';
import { addDays, formatDateBR, todayISO } from '../../core/utils/date.utils';
import { DIAS_VERIFICAR_PRENHEZ, emProtocoloAtivo, estaEmLactacao } from '../../core/utils/ciclo-vaca.utils';
import { estaDesmamado } from '../../core/utils/bezerro.utils';

interface StatCard {
  label: string;
  value: number;
  accent: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  vacas: Vaca[] = [];
  bezerros: Bezerro[] = [];
  inseminacoes: Inseminacao[] = [];
  loading = true;
  erro = '';

  constructor(
    private vacaService: VacaService,
    private bezerroService: BezerroService,
    private inseminacaoService: InseminacaoService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.loading = true;
    this.erro = '';
    try {
      const [vacas, bezerros, inseminacoes] = await Promise.all([
        this.vacaService.listar(),
        this.bezerroService.listar(),
        this.inseminacaoService.listar(),
      ]);
      this.vacas = vacas;
      this.bezerros = bezerros;
      this.inseminacoes = inseminacoes;
    } catch {
      this.erro = 'Erro ao carregar dados. Verifique a configuração do Supabase.';
    } finally {
      this.loading = false;
    }
  }

  contarPorStatus(status: StatusVaca): number {
    return this.vacas.filter((v) => v.status === status).length;
  }

  get stats(): StatCard[] {
    return [
      { label: 'Total de Vacas', value: this.vacas.length, accent: 'green', icon: 'cow', route: '/vacas' },
      {
        label: 'Prenhas',
        value: this.contarPorStatus('prenha'),
        accent: 'emerald',
        icon: 'heart',
        route: '/vacas',
        queryParams: { filtro: 'prenha' },
      },
      {
        label: 'Em Lactação',
        value: this.vacasEmLactacao.length,
        accent: 'blue',
        icon: 'milk',
        route: '/vacas',
        queryParams: { filtro: 'lactacao' },
      },
      {
        label: 'Bezerros no Bezerreiro',
        value: this.bezerrosNoBezerreiro.length,
        accent: 'amber',
        icon: 'calf',
        route: '/bezerros',
        queryParams: { filtro: 'bezerreiro' },
      },
      {
        label: 'Verificar Prenhez',
        value: this.inseminacoesPendentes.length,
        accent: 'rose',
        icon: 'check',
        route: '/inseminacoes',
        queryParams: { filtro: 'pendentes' },
      },
      {
        label: 'Protocolo IATF',
        value: this.vacasEmProtocolo.length,
        accent: 'purple',
        icon: 'protocol',
        route: '/vacas',
        queryParams: { filtro: 'em_protocolo_iatf' },
      },
    ];
  }

  get inseminacoesPendentes(): Inseminacao[] {
    const hoje = todayISO();
    return this.inseminacoes.filter((i) => {
      if (i.confirmada_prenhez || i.repetiu_cio) return false;
      const dataVerificacao = addDays(i.data_inseminacao, DIAS_VERIFICAR_PRENHEZ);
      return dataVerificacao <= hoje;
    });
  }

  get bezerrosNoBezerreiro(): Bezerro[] {
    return this.bezerros.filter((b) => !estaDesmamado(b.data_nascimento) && !b.desmamado);
  }

  get vacasEmLactacao(): Vaca[] {
    return this.vacas.filter((v) => estaEmLactacao(v));
  }

  get vacasEmProtocolo(): Vaca[] {
    return this.vacas.filter((v) => emProtocoloAtivo(v));
  }

  nomeVaca(vacaId: string): string {
    const vaca = this.vacas.find((v) => v.id === vacaId);
    return vaca ? vaca.nome : 'Vaca';
  }

  formatDate = formatDateBR;
}
