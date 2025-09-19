import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(email: string, password: string): boolean {
    // фейковая логика для MVP
    if (email === 'admin@memeup.com' && password === 'admin') {
      localStorage.setItem('role', 'admin');
      localStorage.setItem('userEmail', email);
      return true;
    }
    if (email && password) {
      localStorage.setItem('role', 'user');
      localStorage.setItem('userEmail', email);
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('role');
  }

  getUserRole(): string | null {
    return localStorage.getItem('role');
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }
}
