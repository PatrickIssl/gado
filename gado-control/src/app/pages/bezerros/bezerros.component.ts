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
import { formatDateBR, todayISO } from '../../core/utils/date.utils';

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
  modalForm = false;
  modalBrucelose = false;
  bezerroSelecionado: Bezerro | null = null;
  editando: Bezerro | null = null;
  dataBruceloseForm = todayISO();
  form = {
    vaca_id: '',
    nome: '',
    numero_brinco: '',
    sexo: 'macho' as 'macho' | 'femea',
    data_nascimento: todayISO(),
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
  readonly hoje = todayISO;
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

  textoDiasVida(dataNascimento: string): string {
    const dias = diasNoBezerreiro(dataNascimento);
    if (dias < 0) return 'Ainda não nasceu';
    if (dias === 0) return 'Nasceu hoje';
    if (dias === 1) return '1 dia';
    return `${dias} dias`;
  }

  get tituloModalForm(): string {
    return this.editando ? 'Editar Bezerro' : 'Cadastrar Bezerro';
  }

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

  private formVazio(): typeof this.form {
    return {
      vaca_id: this.vacas[0]?.id ?? '',
      nome: '',
      numero_brinco: '',
      sexo: 'macho',
      data_nascimento: todayISO(),
    };
  }

  abrirCadastro(): void {
    this.editando = null;
    this.form = this.formVazio();
    this.modalForm = true;
    this.erro = '';
  }

  abrirEditar(b: Bezerro): void {
    this.editando = b;
    this.form = {
      vaca_id: b.vaca_id,
      nome: b.nome,
      numero_brinco: b.numero_brinco ?? '',
      sexo: b.sexo,
      data_nascimento: b.data_nascimento,
    };
    this.modalForm = true;
    this.erro = '';
  }

  fecharForm(): void {
    this.modalForm = false;
    this.editando = null;
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

  async salvarForm(): Promise<void> {
    if (!this.form.vaca_id) {
      this.erro = 'Selecione a vaca mãe.';
      return;
    }
    if (!this.form.nome.trim()) {
      this.erro = 'Informe o nome do bezerro.';
      return;
    }
    if (!this.form.numero_brinco.trim()) {
      this.erro = 'Informe o número do brinco.';
      return;
    }
    if (!this.form.data_nascimento) {
      this.erro = 'Informe a data de nascimento.';
      return;
    }
    if (this.form.data_nascimento > todayISO()) {
      this.erro = 'A data de nascimento não pode ser no futuro.';
      return;
    }

    const payload = {
      vaca_id: this.form.vaca_id,
      nome: this.form.nome.trim(),
      numero_brinco: this.form.numero_brinco.trim(),
      sexo: this.form.sexo,
      data_nascimento: this.form.data_nascimento,
    };

    try {
      if (this.editando) {
        await this.bezerroService.atualizar(this.editando.id, payload);
      } else {
        await this.bezerroService.criar(payload);
      }
      this.fecharForm();
      await this.carregar();
    } catch {
      this.erro = this.editando ? 'Erro ao atualizar bezerro.' : 'Erro ao cadastrar bezerro.';
    }
  }
}
