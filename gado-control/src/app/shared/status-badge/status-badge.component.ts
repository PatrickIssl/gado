import { Component, Input } from '@angular/core';
import { STATUS_LABELS, StatusVaca } from '../../core/models/vaca.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [attr.data-status]="status">{{ label }}</span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      border: 1px solid transparent;

      &::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.7;
      }
    }

    .badge[data-status='lactacao'] {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }

    .badge[data-status='seca'] {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }

    .badge[data-status='prenha'] {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }

    .badge[data-status='vazia'] {
      background: #f8fafc;
      color: #64748b;
      border-color: #e2e8f0;
    }

    .badge[data-status='pre_parto'] {
      background: #fdf2f8;
      color: #be185d;
      border-color: #fbcfe8;
    }

    .badge[data-status='em_protocolo_iatf'] {
      background: #f5f3ff;
      color: #6d28d9;
      border-color: #ddd6fe;
    }
  `],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: StatusVaca;

  get label(): string {
    return STATUS_LABELS[this.status];
  }
}
