import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InseminacaoService } from '../../core/services/inseminacao.service';
import { VacaService } from '../../core/services/vaca.service';
import { Inseminacao, TIPO_SEMEN_LABELS } from '../../core/models/inseminacao.model';
import { Vaca } from '../../core/models/vaca.model';
import { addDays, formatDateBR, todayISO, daysFromToday } from '../../core/utils/date.utils';
import { DIAS_VERIFICAR_PRENHEZ } from '../../core/utils/ciclo-vaca.utils';

@Component({
  selector: 'app-inseminacoes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inseminacoes.component.html',
  styleUrl: './inseminacoes.component.scss',
})
export class InseminacoesComponent implements OnInit {
  inseminacoes: Inseminacao[] = [];
  vacas: Vaca[] = [];
  loading = true;
  erro = '';
  modalAberto = false;
  filtro = 'todos';

  form = {
    vaca_id: '',
    data_inseminacao: todayISO(),
    observacoes: '',
  };

  constructor(
    private inseminacaoService: InseminacaoService,
    private vacaService: VacaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const filtro = params.get('filtro');
      this.filtro = filtro === 'pendentes' ? 'pendentes' : 'todos';
    });
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.loading = true;
    this.erro = '';
    try {
      const [inseminacoes, vacas] = await Promise.all([
        this.inseminacaoService.listar(),
        this.vacaService.listar(),
      ]);
      this.inseminacoes = inseminacoes;
      this.vacas = vacas;
    } catch {
      this.erro = 'Erro ao carregar inseminações.';
    } finally {
      this.loading = false;
    }
  }

  nomeVaca(vacaId: string): string {
    const vaca = this.vacas.find((v) => v.id === vacaId);
    return vaca ? `${vaca.nome} (#${vaca.numero})` : '—';
  }

  dataVerificacao(dataInsem: string): string {
    return addDays(dataInsem, DIAS_VERIFICAR_PRENHEZ);
  }

  formatDate = formatDateBR;
  readonly tipoSemenLabels = TIPO_SEMEN_LABELS;

  ePendenteVerificacao(i: Inseminacao): boolean {
    if (i.confirmada_prenhez || i.repetiu_cio) return false;
    return daysFromToday(this.dataVerificacao(i.data_inseminacao)) <= 0;
  }

  get inseminacoesExibidas(): Inseminacao[] {
    if (this.filtro === 'pendentes') {
      return this.inseminacoes.filter((i) => this.ePendenteVerificacao(i));
    }
    return this.inseminacoes;
  }

  onFiltroChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.filtro === 'todos' ? { filtro: null } : { filtro: this.filtro },
      queryParamsHandling: 'merge',
    });
  }

  get subtituloListagem(): string {
    if (this.filtro === 'todos') {
      return `${this.inseminacoes.length} registradas`;
    }
    return `${this.inseminacoesExibidas.length} de ${this.inseminacoes.length} · filtro: Verificar prenhez`;
  }

  statusInseminacao(i: Inseminacao): string {
    if (i.confirmada_prenhez) return 'Prenhez confirmada';
    if (i.repetiu_cio) return 'Repetiu cio';
    const dias = daysFromToday(this.dataVerificacao(i.data_inseminacao));
    if (dias <= 0) return 'Verificar prenhez agora';
    return `Verificar em ${dias}d`;
  }

  classeStatus(i: Inseminacao): string {
    if (i.confirmada_prenhez) return 'ok';
    if (i.repetiu_cio) return 'warn';
    const dias = daysFromToday(this.dataVerificacao(i.data_inseminacao));
    if (dias <= 0) return 'action';
    return '';
  }

  abrirModal(): void {
    this.form = { vaca_id: '', data_inseminacao: todayISO(), observacoes: '' };
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  async salvar(): Promise<void> {
    if (!this.form.vaca_id) return;
    try {
      const vaca = this.vacas.find((v) => v.id === this.form.vaca_id);
      await this.inseminacaoService.registrar(this.form, vaca);
      this.fecharModal();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao registrar inseminação.';
    }
  }

  async confirmarPrenhez(i: Inseminacao): Promise<void> {
    try {
      await this.inseminacaoService.confirmarPrenhez(i.id, i.vaca_id);
      await this.carregar();
    } catch {
      this.erro = 'Erro ao confirmar prenhez.';
    }
  }

  async marcarRepetiuCio(i: Inseminacao): Promise<void> {
    try {
      await this.inseminacaoService.marcarRepetiuCio(i.id, i.vaca_id);
      await this.carregar();
    } catch {
      this.erro = 'Erro ao marcar repetição de cio.';
    }
  }

  get vacasDisponiveis(): Vaca[] {
    return this.vacas.filter(
      (v) => v.status === 'vazia' || v.status === 'seca' || v.status === 'em_protocolo_iatf'
    );
  }
}
