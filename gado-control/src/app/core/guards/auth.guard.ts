import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!(await auth.ensureSession())) {
    return router.createUrlTree(['/login']);
  }

  if (!(await auth.ensurePerfil())) {
    return router.createUrlTree(['/completar-cadastro']);
  }

  return true;
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (await auth.ensureSession()) {
    if (await auth.ensurePerfil()) {
      return router.createUrlTree(['/painel']);
    }
    return router.createUrlTree(['/completar-cadastro']);
  }

  return true;
};

export const completarCadastroGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!(await auth.ensureSession())) {
    return router.createUrlTree(['/login']);
  }

  if (await auth.ensurePerfil()) {
    return router.createUrlTree(['/painel']);
  }

  return true;
};
