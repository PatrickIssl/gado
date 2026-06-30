import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VacaService } from '../../core/services/vaca.service';
import { BezerroService } from '../../core/services/bezerro.service';
import { InseminacaoService } from '../../core/services/inseminacao.service';
import { CioService } from '../../core/services/cio.service';
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  StatusVaca,
  Vaca,
  VacaFormData,
} from '../../core/models/vaca.model';
import { TipoSemen, TIPO_SEMEN_LABELS } from '../../core/models/inseminacao.model';
import {
  ehPrenha,
  emProtocoloAtivo,
  estaEmLactacao,
  montarLinhasDatas,
  montarResumoVaca,
  podeInseminarAposCio,
  podeRegistrarCio,
  precisaProtocoloIatf,
  statusesExibicao,
  textoDiasRelativo,
  ultimoCio,
  dataInseminacaoAposParto,
} from '../../core/utils/ciclo-vaca.utils';
import { formatDateBR, todayISO } from '../../core/utils/date.utils';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type ModalTipo = 'criar' | 'editar' | 'parto' | 'inseminacao' | 'protocolo' | null;

type SituacaoWizard =
  | 'lactacao'
  | 'prenha_lactacao'
  | 'aborto_lactacao'
  | 'aguardando_prenhez'
  | 'protocolo'
  | 'vazia'
  | 'seca'
  | 'pre_parto';

interface WizardCadastro {
  numero: string;
  nome: string;
  raca: string;
  total_prenhezes: number;
  doente: boolean;
  doenca: string;
  teveParto: boolean | null;
  data_parto: string | null;
  situacao: SituacaoWizard | null;
  data_inseminacao: string | null;
  data_aborto: string | null;
  boi: string;
  tipo_semen: TipoSemen | null;
  data_inicio_protocolo: string | null;
  dias_protocolo: 10 | 11;
}

@Component({
  selector: 'app-vacas',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent],
  templateUrl: './vacas.component.html',
  styleUrl: './vacas.component.scss',
})
export class VacasComponent implements OnInit {
  vacas: Vaca[] = [];
  filtradas: Vaca[] = [];
  loading = true;
  erro = '';
  busca = '';
  filtroStatus = 'todos';
  expandedIds = new Set<string>();

  modal: ModalTipo = null;
  vacaSelecionada: Vaca | null = null;

  form: VacaFormData = {
    numero: '',
    nome: '',
    raca: '',
    status: 'vazia',
    data_parto: null,
    data_inseminacao_prenhez: null,
    data_ultima_inseminacao: null,
    data_aborto: null,
    data_inicio_protocolo_iatf: null,
    dias_protocolo_iatf: null,
    total_prenhezes: 0,
    doente: false,
    doenca: null,
  };
  formBezerro = { nome: '', numero_brinco: '', sexo: 'macho' as 'macho' | 'femea' };
  formInseminacao = { data_inseminacao: todayISO(), observacoes: '' };
  diasProtocolo: 10 | 11 = 11;

  wizardStep = 1;
  readonly wizardTotalSteps = 4;
  wizard: WizardCadastro = this.wizardVazio();
  wizardErro = '';

  readonly statusOptions = STATUS_OPTIONS;
  readonly statusLabels = STATUS_LABELS;
  readonly tipoSemenLabels = TIPO_SEMEN_LABELS;

  constructor(
    private vacaService: VacaService,
    private bezerroService: BezerroService,
    private inseminacaoService: InseminacaoService,
    private cioService: CioService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.filtroStatus = this.parseFiltroUrl(params.get('filtro'));
      this.aplicarFiltros();
    });
    this.carregar();
  }

  private parseFiltroUrl(filtro: string | null): string {
    if (!filtro || filtro === 'todos') return 'todos';
    if (filtro === 'lactacao') return 'lactacao';
    if (filtro === 'doente') return 'doente';
    if (STATUS_OPTIONS.includes(filtro as StatusVaca)) return filtro;
    return 'todos';
  }

  async carregar(): Promise<void> {
    this.loading = true;
    this.erro = '';
    try {
      this.vacas = await this.vacaService.listar();
      this.aplicarFiltros();
    } catch {
      this.erro = 'Erro ao carregar vacas. Verifique a configuração do Supabase.';
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros(): void {
    let lista = [...this.vacas];
    if (this.busca.trim()) {
      const termo = this.busca.toLowerCase();
      lista = lista.filter(
        (v) =>
          v.nome.toLowerCase().includes(termo) ||
          v.numero.toLowerCase().includes(termo)
      );
    }
    if (this.filtroStatus !== 'todos') {
      if (this.filtroStatus === 'lactacao') {
        lista = lista.filter((v) => estaEmLactacao(v));
      } else if (this.filtroStatus === 'prenha') {
        lista = lista.filter((v) => v.status === 'prenha');
      } else if (this.filtroStatus === 'em_protocolo_iatf') {
        lista = lista.filter((v) => emProtocoloAtivo(v));
      } else if (this.filtroStatus === 'doente') {
        lista = lista.filter((v) => v.doente);
      } else {
        lista = lista.filter((v) => v.status === this.filtroStatus);
      }
    }
    this.filtradas = lista;
  }

  onBuscaChange(): void {
    this.aplicarFiltros();
  }

  onFiltroStatusChange(): void {
    this.aplicarFiltros();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.filtroStatus === 'todos' ? { filtro: null } : { filtro: this.filtroStatus },
      queryParamsHandling: 'merge',
    });
  }

  get subtituloListagem(): string {
    if (this.filtroStatus === 'todos') {
      return `${this.vacas.length} cadastradas`;
    }
    const label =
      this.filtroStatus === 'lactacao'
        ? 'Em Lactação'
        : this.filtroStatus === 'doente'
          ? 'Doentes'
          : this.statusLabels[this.filtroStatus as StatusVaca] ?? this.filtroStatus;
    return `${this.filtradas.length} de ${this.vacas.length} · filtro: ${label}`;
  }

  abrirCriar(): void {
    this.wizard = this.wizardVazio();
    this.wizardStep = 1;
    this.wizardErro = '';
    this.vacaSelecionada = null;
    this.modal = 'criar';
  }

  private wizardVazio(): WizardCadastro {
    return {
      numero: '',
      nome: '',
      raca: '',
      total_prenhezes: 0,
      doente: false,
      doenca: '',
      teveParto: null,
      data_parto: null,
      situacao: null,
      data_inseminacao: null,
      data_aborto: null,
      boi: '',
      tipo_semen: null,
      data_inicio_protocolo: null,
      dias_protocolo: 11,
    };
  }

  get wizardTitulos(): string[] {
    return ['Identificação', 'Parto', 'Situação', 'Confirmar'];
  }

  get situacoesDisponiveis(): Array<{ id: SituacaoWizard; titulo: string; desc: string; icon: string }> {
    if (this.wizard.teveParto === false) {
      return [
        {
          id: 'vazia',
          titulo: 'Vazia / novilha',
          desc: 'Sem parto registrado no sistema',
          icon: '○',
        },
      ];
    }
    return [
      {
        id: 'lactacao',
        titulo: 'Só em lactação',
        desc: 'Deu cria e está dando leite — ainda não prenha',
        icon: '🥛',
      },
      {
        id: 'prenha_lactacao',
        titulo: 'Lactando e prenha',
        desc: 'Melhor cenário: leite + gestação confirmada',
        icon: '🥛🤰',
      },
      {
        id: 'aborto_lactacao',
        titulo: 'Abortou — ainda em lactação',
        desc: 'Perdeu a gestação, continua dando leite; 40 dias para IA a partir do aborto',
        icon: '⚠️🥛',
      },
      {
        id: 'aguardando_prenhez',
        titulo: 'Inseminada — verificar prenhez',
        desc: 'IA feita, aguardando os 21 dias para confirmar',
        icon: '⏳',
      },
      {
        id: 'protocolo',
        titulo: 'Em protocolo IATF',
        desc: 'Passou 40d sem cio natural — protocolo ativo',
        icon: '📋',
      },
      {
        id: 'seca',
        titulo: 'Período seco',
        desc: 'Parou de lactar, ganhando peso',
        icon: '🌾',
      },
      {
        id: 'pre_parto',
        titulo: 'Pré-parto',
        desc: 'Últimos 30 dias no curral fechado',
        icon: '🏠',
      },
    ];
  }

  wizardAvancar(): void {
    this.wizardErro = '';
    if (!this.validarWizardStep(this.wizardStep)) return;

    if (this.wizardStep === 2 && this.wizard.teveParto === false) {
      this.wizard.situacao = 'vazia';
    }

    if (this.wizardStep < this.wizardTotalSteps) {
      this.wizardStep++;
      if (this.wizardStep === 3 && this.wizard.teveParto === false) {
        this.wizard.situacao = 'vazia';
      }
      if (this.wizardStep === 3 && this.wizard.teveParto && !this.wizard.situacao) {
        this.wizard.situacao = 'lactacao';
      }
      if (this.wizardStep === 3 && this.wizard.situacao === 'protocolo' && !this.wizard.data_inicio_protocolo) {
        this.wizard.data_inicio_protocolo = todayISO();
      }
    }
  }

  wizardVoltar(): void {
    this.wizardErro = '';
    if (this.wizardStep > 1) this.wizardStep--;
  }

  selecionarSituacao(id: SituacaoWizard): void {
    this.wizard.situacao = id;
    if (id !== 'prenha_lactacao') {
      this.wizard.boi = '';
      this.wizard.tipo_semen = null;
    }
    if (id !== 'aborto_lactacao') {
      this.wizard.data_aborto = null;
    }
    this.wizardErro = '';
  }

  previewInseminarAposAborto(): string | null {
    if (!this.wizard.data_aborto) return null;
    return dataInseminacaoAposParto(this.wizard.data_aborto);
  }

  validarWizardStep(step: number): boolean {
    if (step === 1) {
      if (!this.wizard.numero.trim() || !this.wizard.nome.trim()) {
        this.wizardErro = 'Informe número e nome da vaca.';
        return false;
      }
      if (this.wizard.doente && !this.wizard.doenca.trim()) {
        this.wizardErro = 'Informe a doença ou desmarque que a vaca está doente.';
        return false;
      }
      if (this.wizard.total_prenhezes < 0) {
        this.wizardErro = 'O total de prenhezes não pode ser negativo.';
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (this.wizard.teveParto === null) {
        this.wizardErro = 'Selecione se a vaca já teve parto.';
        return false;
      }
      if (this.wizard.teveParto && !this.wizard.data_parto) {
        this.wizardErro = 'Informe a data do último parto.';
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!this.wizard.situacao) {
        this.wizardErro = 'Selecione a situação atual da vaca.';
        return false;
      }
      if (
        (this.wizard.situacao === 'prenha_lactacao' ||
          this.wizard.situacao === 'aguardando_prenhez') &&
        !this.wizard.data_inseminacao
      ) {
        this.wizardErro = 'Informe a data da inseminação.';
        return false;
      }
      if (this.wizard.situacao === 'prenha_lactacao') {
        if (!this.wizard.boi.trim()) {
          this.wizardErro = 'Informe o boi usado na inseminação.';
          return false;
        }
        if (!this.wizard.tipo_semen) {
          this.wizardErro = 'Selecione o tipo de sêmen (sexado ou convencional).';
          return false;
        }
      }
      if (this.wizard.situacao === 'protocolo' && !this.wizard.data_inicio_protocolo) {
        this.wizardErro = 'Informe o início do protocolo.';
        return false;
      }
      if (this.wizard.situacao === 'aborto_lactacao') {
        if (!this.wizard.data_aborto) {
          this.wizardErro = 'Informe a data do aborto.';
          return false;
        }
        if (this.wizard.data_parto && this.wizard.data_aborto < this.wizard.data_parto) {
          this.wizardErro = 'A data do aborto deve ser posterior ao último parto.';
          return false;
        }
      }
      return true;
    }
    return true;
  }

  wizardResumoSituacao(): string {
    const map: Record<SituacaoWizard, string> = {
      lactacao: 'Em lactação',
      prenha_lactacao: 'Lactando e prenha',
      aborto_lactacao: 'Abortou — em lactação (aguardando 40d para IA)',
      aguardando_prenhez: 'Inseminada — aguardando verificar prenhez',
      protocolo: 'Em protocolo IATF',
      vazia: 'Vazia / novilha',
      seca: 'Período seco',
      pre_parto: 'Pré-parto',
    };
    return this.wizard.situacao ? map[this.wizard.situacao] : '—';
  }

  private wizardParaForm(): VacaFormData {
    const w = this.wizard;
    const form: VacaFormData = {
      numero: w.numero.trim(),
      nome: w.nome.trim(),
      raca: w.raca.trim(),
      status: 'vazia',
      data_parto: w.teveParto ? w.data_parto : null,
      data_aborto: null,
      data_inseminacao_prenhez: null,
      data_ultima_inseminacao: null,
      data_inicio_protocolo_iatf: null,
      dias_protocolo_iatf: null,
      total_prenhezes: Math.max(0, w.total_prenhezes),
      doente: w.doente,
      doenca: w.doente && w.doenca.trim() ? w.doenca.trim() : null,
    };

    switch (w.situacao) {
      case 'lactacao':
        form.status = 'lactacao';
        break;
      case 'aborto_lactacao':
        form.status = 'lactacao';
        form.data_aborto = w.data_aborto;
        break;
      case 'prenha_lactacao':
        form.status = 'prenha';
        form.data_inseminacao_prenhez = w.data_inseminacao;
        break;
      case 'aguardando_prenhez':
        form.status = w.teveParto ? 'lactacao' : 'vazia';
        form.data_ultima_inseminacao = w.data_inseminacao;
        break;
      case 'protocolo':
        form.status = 'em_protocolo_iatf';
        form.data_inicio_protocolo_iatf = w.data_inicio_protocolo ?? todayISO();
        form.dias_protocolo_iatf = w.dias_protocolo;
        break;
      case 'seca':
        form.status = 'seca';
        break;
      case 'pre_parto':
        form.status = 'pre_parto';
        break;
      default:
        form.status = 'vazia';
    }

    return form;
  }

  async finalizarWizard(): Promise<void> {
    this.wizardErro = '';
    if (!this.validarWizardStep(3)) return;

    try {
      const form = this.wizardParaForm();
      const vaca = await this.vacaService.criar(form);

      if (
        this.wizard.situacao === 'aguardando_prenhez' &&
        this.wizard.data_inseminacao
      ) {
        await this.inseminacaoService.registrar(
          {
            vaca_id: vaca.id,
            data_inseminacao: this.wizard.data_inseminacao,
            observacoes: 'Cadastro inicial — aguardando verificação',
          },
          { ...vaca, ...form } as Vaca
        );
      }

      if (
        this.wizard.situacao === 'prenha_lactacao' &&
        this.wizard.data_inseminacao &&
        this.wizard.tipo_semen
      ) {
        await this.inseminacaoService.registrarPrenhezConfirmada({
          vaca_id: vaca.id,
          data_inseminacao: this.wizard.data_inseminacao,
          touro: this.wizard.boi.trim(),
          tipo_semen: this.wizard.tipo_semen,
        });
      }

      this.fecharModal();
      await this.carregar();
    } catch {
      this.wizardErro = 'Erro ao cadastrar vaca.';
    }
  }

  onTevePartoChange(teve: boolean): void {
    this.wizard.teveParto = teve;
    if (!teve) {
      this.wizard.data_parto = null;
      this.wizard.situacao = 'vazia';
    } else {
      this.wizard.situacao = 'lactacao';
    }
    this.wizardErro = '';
  }

  abrirEditar(vaca: Vaca): void {
    this.vacaSelecionada = vaca;
    this.form = {
      numero: vaca.numero,
      nome: vaca.nome,
      raca: vaca.raca,
      status: vaca.status,
      data_parto: vaca.data_parto,
      data_aborto: vaca.data_aborto,
      data_inseminacao_prenhez: vaca.data_inseminacao_prenhez,
      data_ultima_inseminacao: vaca.data_ultima_inseminacao,
      data_inicio_protocolo_iatf: vaca.data_inicio_protocolo_iatf,
      dias_protocolo_iatf: (vaca.dias_protocolo_iatf as 10 | 11 | null) ?? null,
      total_prenhezes: vaca.total_prenhezes ?? 0,
      doente: vaca.doente ?? false,
      doenca: vaca.doenca,
    };
    this.modal = 'editar';
  }

  abrirParto(vaca: Vaca): void {
    if (vaca.status !== 'prenha') return;
    this.vacaSelecionada = vaca;
    this.formBezerro = { nome: '', numero_brinco: '', sexo: 'macho' };
    this.modal = 'parto';
  }

  abrirInseminacao(vaca: Vaca): void {
    this.vacaSelecionada = vaca;
    this.formInseminacao = {
      data_inseminacao: ultimoCio(vaca) ?? todayISO(),
      observacoes: '',
    };
    this.modal = 'inseminacao';
  }

  abrirProtocolo(vaca: Vaca): void {
    this.vacaSelecionada = vaca;
    this.diasProtocolo = 11;
    this.modal = 'protocolo';
  }

  fecharModal(): void {
    this.modal = null;
    this.vacaSelecionada = null;
    this.wizardErro = '';
  }

  async salvar(): Promise<void> {
    if (!this.form.numero || !this.form.nome) return;
    if (this.form.status === 'prenha' && !this.form.data_inseminacao_prenhez) {
      this.erro = 'Informe a data da inseminação para vacas prenhas.';
      return;
    }
    if (this.form.doente && !this.form.doenca?.trim()) {
      this.erro = 'Informe a doença ou desmarque que a vaca está doente.';
      return;
    }
    try {
      if (this.modal === 'editar' && this.vacaSelecionada) {
        await this.vacaService.atualizar(this.vacaSelecionada.id, this.form);
      }
      this.fecharModal();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao salvar vaca.';
    }
  }

  async confirmarParto(): Promise<void> {
    if (!this.vacaSelecionada || !this.formBezerro.nome.trim()) return;
    if (!this.formBezerro.numero_brinco.trim()) {
      this.erro = 'Informe o número do brinco do bezerro.';
      return;
    }
    try {
      const vaca = await this.vacaService.registrarParto(this.vacaSelecionada.id);
      await this.bezerroService.criar({
        vaca_id: vaca.id,
        nome: this.formBezerro.nome.trim(),
        numero_brinco: this.formBezerro.numero_brinco.trim(),
        sexo: this.formBezerro.sexo,
        data_nascimento: todayISO(),
      });
      this.fecharModal();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao registrar parto.';
    }
  }

  async salvarInseminacao(): Promise<void> {
    if (!this.vacaSelecionada) return;
    try {
      await this.inseminacaoService.registrar(
        {
          vaca_id: this.vacaSelecionada.id,
          data_inseminacao: this.formInseminacao.data_inseminacao,
          observacoes: this.formInseminacao.observacoes || undefined,
        },
        this.vacaSelecionada
      );
      this.fecharModal();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao registrar inseminação.';
    }
  }

  async excluir(vaca: Vaca): Promise<void> {
    if (!confirm(`Excluir a vaca ${vaca.nome}?`)) return;
    try {
      await this.vacaService.excluir(vaca.id);
      await this.carregar();
    } catch {
      this.erro = 'Erro ao excluir vaca.';
    }
  }

  async marcarCio(vaca: Vaca): Promise<void> {
    try {
      await this.cioService.registrar({
        vaca_id: vaca.id,
        data_cio: todayISO(),
      });

      const manterLactacao = estaEmLactacao(vaca);
      await this.vacaService.atualizar(vaca.id, {
        status: manterLactacao ? 'lactacao' : 'vazia',
      });

      await this.carregar();
      const atualizada = this.vacas.find((v) => v.id === vaca.id);
      if (atualizada && podeInseminarAposCio(atualizada)) {
        this.abrirInseminacao(atualizada);
      }
    } catch {
      this.erro = 'Erro ao registrar cio.';
    }
  }

  async confirmarProtocolo(): Promise<void> {
    if (!this.vacaSelecionada) return;
    try {
      await this.vacaService.entrarProtocoloIatf(this.vacaSelecionada.id, this.diasProtocolo);
      this.fecharModal();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao entrar no protocolo.';
    }
  }

  resumoVaca(vaca: Vaca) {
    return montarResumoVaca(vaca);
  }

  linhasDatas(vaca: Vaca) {
    return montarLinhasDatas(vaca);
  }

  toggleDetalhes(vacaId: string): void {
    if (this.expandedIds.has(vacaId)) {
      this.expandedIds.delete(vacaId);
    } else {
      this.expandedIds.add(vacaId);
    }
  }

  estaExpandida(vacaId: string): boolean {
    return this.expandedIds.has(vacaId);
  }

  textoDias = textoDiasRelativo;

  temAcoes(vaca: Vaca): boolean {
    return (
      this.podeParir(vaca) ||
      this.podeRegistrarCio(vaca) ||
      this.podeInseminar(vaca) ||
      this.podeColocarEmProtocolo(vaca)
    );
  }

  badges(vaca: Vaca): StatusVaca[] {
    return statusesExibicao(vaca);
  }

  formatDate = formatDateBR;
  estaEmLactacao = estaEmLactacao;
  ehPrenha = ehPrenha;

  podeInseminar(vaca: Vaca): boolean {
    return podeInseminarAposCio(vaca);
  }

  podeRegistrarCio = podeRegistrarCio;
  podeColocarEmProtocolo = precisaProtocoloIatf;

  iniciais(vaca: Vaca): string {
    return vaca.numero.slice(-3).padStart(3, '0');
  }

  podeParir(vaca: Vaca): boolean {
    return vaca.status === 'prenha';
  }

  labelPrenhezes(vaca: Vaca): string {
    const n = vaca.total_prenhezes ?? 0;
    return n === 1 ? '1 prenhez' : `${n} prenhezes`;
  }
}
