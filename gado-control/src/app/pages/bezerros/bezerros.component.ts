import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BezerroService } from '../../core/services/bezerro.service';
import { VacaService } from '../../core/services/vaca.service';
import { Bezerro } from '../../core/models/bezerro.model';
import { Vaca } from '../../core/models/vaca.model';
import {
  aguardandoBrucelose,
  bruceloseAplicada,
  brucelosePendente,
  dataBrucelose,
  dataSaidaBezerreiro,
  diasNoBezerreiro,
  diasParaBrucelose,
  diasRestantesBezerreiro,
  eBezerra,
  programaLeiteAtual,
  estaDesmamado,
} from '../../core/utils/bezerro.utils';
import { addDays, formatDateBR, todayISO } from '../../core/utils/date.utils';

@Component({
  selector: 'app-bezerros',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bezerros.component.html',
  styleUrl: './bezerros.component.scss',
})
export class BezerrosComponent implements OnInit {
  bezerros: Bezerro[] = [];
  vacas: Vaca[] = [];
  loading = true;
  erro = '';
  filtro = 'todos';
  modalCadastro = false;
  modalBrucelose = false;
  bezerroSelecionado: Bezerro | null = null;
  dataBruceloseForm = todayISO();
  formCadastro = {
    vaca_id: '',
    nome: '',
    sexo: 'macho' as 'macho' | 'femea',
    dias_vida: 0,
  };

  constructor(
    private bezerroService: BezerroService,
    private vacaService: VacaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const filtro = params.get('filtro');
      if (filtro === 'bezerreiro' || filtro === 'desmamados' || filtro === 'brucelose_pendente') {
        this.filtro = filtro;
      } else {
        this.filtro = 'todos';
      }
    });
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.loading = true;
    this.erro = '';
    try {
      const [bezerros, vacas] = await Promise.all([
        this.bezerroService.listar(),
        this.vacaService.listar(),
      ]);
      this.bezerros = bezerros;
      this.vacas = vacas;
    } catch {
      this.erro = 'Erro ao carregar bezerros.';
    } finally {
      this.loading = false;
    }
  }

  nomeMae(vacaId: string): string {
    const vaca = this.vacas.find((v) => v.id === vacaId);
    return vaca ? vaca.nome : '—';
  }

  formatDate = formatDateBR;
  programaLeite = programaLeiteAtual;
  diasNoBezerreiro = diasNoBezerreiro;
  diasRestantes = diasRestantesBezerreiro;
  dataSaida = dataSaidaBezerreiro;
  estaDesmamado = estaDesmamado;
  eBezerra = eBezerra;
  bruceloseAplicada = bruceloseAplicada;
  brucelosePendente = brucelosePendente;
  aguardandoBrucelose = aguardandoBrucelose;
  dataBrucelose = dataBrucelose;
  diasParaBrucelose = diasParaBrucelose;
  Math = Math;

  get filtrados(): Bezerro[] {
    if (this.filtro === 'bezerreiro') {
      return this.bezerros.filter((b) => !estaDesmamado(b.data_nascimento) && !b.desmamado);
    }
    if (this.filtro === 'desmamados') {
      return this.bezerros.filter((b) => estaDesmamado(b.data_nascimento) || b.desmamado);
    }
    if (this.filtro === 'brucelose_pendente') {
      return this.bezerros.filter((b) => brucelosePendente(b));
    }
    return this.bezerros;
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
      return `${this.bezerros.length} cadastrados`;
    }
    const labels: Record<string, string> = {
      bezerreiro: 'No Bezerreiro',
      desmamados: 'Desmamados',
      brucelose_pendente: 'Brucelose pendente',
    };
    return `${this.filtrados.length} de ${this.bezerros.length} · filtro: ${labels[this.filtro]}`;
  }

  async marcarDesmamado(b: Bezerro): Promise<void> {
    try {
      await this.bezerroService.marcarDesmamado(b.id);
      await this.carregar();
    } catch {
      this.erro = 'Erro ao marcar desmame.';
    }
  }

  async excluir(b: Bezerro): Promise<void> {
    if (!confirm(`Excluir o bezerro ${b.nome}?`)) return;
    try {
      await this.bezerroService.excluir(b.id);
      await this.carregar();
    } catch {
      this.erro = 'Erro ao excluir bezerro.';
    }
  }

  abrirCadastro(): void {
    this.formCadastro = {
      vaca_id: this.vacas[0]?.id ?? '',
      nome: '',
      sexo: 'macho',
      dias_vida: 0,
    };
    this.modalCadastro = true;
    this.erro = '';
  }

  fecharCadastro(): void {
    this.modalCadastro = false;
  }

  abrirBrucelose(b: Bezerro): void {
    this.bezerroSelecionado = b;
    this.dataBruceloseForm = todayISO();
    this.modalBrucelose = true;
    this.erro = '';
  }

  fecharBrucelose(): void {
    this.modalBrucelose = false;
    this.bezerroSelecionado = null;
  }

  async confirmarBrucelose(): Promise<void> {
    if (!this.bezerroSelecionado || !this.dataBruceloseForm) return;
    try {
      await this.bezerroService.registrarBrucelose(
        this.bezerroSelecionado.id,
        this.dataBruceloseForm
      );
      this.fecharBrucelose();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao registrar vacina de brucelose.';
    }
  }

  get dataNascimentoCalculada(): string {
    const dias = Math.max(0, this.formCadastro.dias_vida ?? 0);
    return addDays(todayISO(), -dias);
  }

  async salvarCadastro(): Promise<void> {
    if (!this.formCadastro.vaca_id) {
      this.erro = 'Selecione a vaca mãe.';
      return;
    }
    if (!this.formCadastro.nome.trim()) {
      this.erro = 'Informe o nome do bezerro.';
      return;
    }
    if (this.formCadastro.dias_vida < 0) {
      this.erro = 'Os dias de vida não podem ser negativos.';
      return;
    }
    try {
      await this.bezerroService.criar({
        vaca_id: this.formCadastro.vaca_id,
        nome: this.formCadastro.nome.trim(),
        sexo: this.formCadastro.sexo,
        data_nascimento: this.dataNascimentoCalculada,
      });
      this.fecharCadastro();
      await this.carregar();
    } catch {
      this.erro = 'Erro ao cadastrar bezerro.';
    }
  }
}
