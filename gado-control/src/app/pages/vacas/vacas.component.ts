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
import {
  ehPrenha,
  emProtocoloAtivo,
  estaEmLactacao,
  montarResumoVaca,
  podeInseminarAposCio,
  podeRegistrarCio,
  precisaProtocoloIatf,
  statusesExibicao,
  textoDiasRelativo,
  ultimoCio,
} from '../../core/utils/ciclo-vaca.utils';
import { formatDateBR, todayISO } from '../../core/utils/date.utils';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type ModalTipo = 'criar' | 'editar' | 'parto' | 'inseminacao' | 'protocolo' | null;

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

  modal: ModalTipo = null;
  vacaSelecionada: Vaca | null = null;

  form: VacaFormData = { numero: '', nome: '', raca: '', status: 'vazia' };
  formBezerro = { nome: '', sexo: 'macho' as 'macho' | 'femea' };
  formInseminacao = { data_inseminacao: todayISO(), observacoes: '' };
  diasProtocolo: 10 | 11 = 11;

  readonly statusOptions = STATUS_OPTIONS;
  readonly statusLabels = STATUS_LABELS;

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
        : this.statusLabels[this.filtroStatus as StatusVaca] ?? this.filtroStatus;
    return `${this.filtradas.length} de ${this.vacas.length} · filtro: ${label}`;
  }

  abrirCriar(): void {
    this.form = { numero: '', nome: '', raca: '', status: 'vazia' };
    this.vacaSelecionada = null;
    this.modal = 'criar';
  }

  abrirEditar(vaca: Vaca): void {
    this.vacaSelecionada = vaca;
    this.form = {
      numero: vaca.numero,
      nome: vaca.nome,
      raca: vaca.raca,
      status: vaca.status,
    };
    this.modal = 'editar';
  }

  abrirParto(vaca: Vaca): void {
    if (vaca.status !== 'prenha') return;
    this.vacaSelecionada = vaca;
    this.formBezerro = { nome: '', sexo: 'macho' };
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
  }

  async salvar(): Promise<void> {
    if (!this.form.numero || !this.form.nome) return;
    try {
      if (this.modal === 'criar') {
        await this.vacaService.criar(this.form);
      } else if (this.modal === 'editar' && this.vacaSelecionada) {
        await this.vacaService.atualizar(this.vacaSelecionada.id, this.form);
      }
      this.fecharModal();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao salvar vaca.';
    }
  }

  async confirmarParto(): Promise<void> {
    if (!this.vacaSelecionada || !this.formBezerro.nome) return;
    try {
      const vaca = await this.vacaService.registrarParto(this.vacaSelecionada.id);
      await this.bezerroService.criar({
        vaca_id: vaca.id,
        nome: this.formBezerro.nome,
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
}
