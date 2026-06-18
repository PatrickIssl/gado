import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BezerroService } from '../../core/services/bezerro.service';
import { VacaService } from '../../core/services/vaca.service';
import { Bezerro } from '../../core/models/bezerro.model';
import { Vaca } from '../../core/models/vaca.model';
import {
  dataSaidaBezerreiro,
  diasNoBezerreiro,
  diasRestantesBezerreiro,
  programaLeiteAtual,
  estaDesmamado,
} from '../../core/utils/bezerro.utils';
import { formatDateBR } from '../../core/utils/date.utils';

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

  constructor(
    private bezerroService: BezerroService,
    private vacaService: VacaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const filtro = params.get('filtro');
      this.filtro = filtro === 'bezerreiro' || filtro === 'desmamados' ? filtro : 'todos';
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
  Math = Math;

  get filtrados(): Bezerro[] {
    if (this.filtro === 'bezerreiro') {
      return this.bezerros.filter((b) => !estaDesmamado(b.data_nascimento) && !b.desmamado);
    }
    if (this.filtro === 'desmamados') {
      return this.bezerros.filter((b) => estaDesmamado(b.data_nascimento) || b.desmamado);
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
}
