
import React, { useState } from 'react';
import { Usuario } from '../types';
import { MockService } from '../services/api';
import { Building2, ArrowRight, KeyRound, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface LoginProps {
  onLogin: (user: Usuario) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const user = await MockService.login(email, password);
        showToast(`Bienvenido, ${user.nombre}`, 'success');
        onLogin(user);
    } catch (err) {
        showToast('Credenciales inválidas o usuario inactivo.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setForgotStatus('loading');
      MockService.recoverPassword(forgotEmail)
        .then(() => {
            setForgotStatus('success');
            showToast('Se ha enviado un correo con las instrucciones de recuperación.', 'success');
        })
        .catch((err) => {
            setForgotStatus('error');
            showToast(err as string, 'error');
        });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative mb-8">
        <div className="bg-red-700 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 backdrop-blur-sm">
                <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">S&G Edifica</h1>
            <p className="text-red-100">SGI-Construct</p>
        </div>
        
        <div className="p-8">
          {!showForgot ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo Corporativo
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                    placeholder="usuario@empresa.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-red-600 hover:text-red-800">
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Validando...' : (
                      <span className="flex items-center">
                          Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                  )}
                </button>
              </form>
          ) : (
              <div className="space-y-4">
                  <div className="text-center">
                      <div className="inline-flex p-3 bg-red-50 rounded-full mb-2">
                        <KeyRound className="h-6 w-6 text-red-600"/>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Recuperar Contraseña</h3>
                      <p className="text-sm text-gray-500">Ingresa tu correo para recibir instrucciones.</p>
                  </div>
                  
                  {forgotStatus !== 'success' ? (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-gray-900"
                            placeholder="usuario@empresa.com"
                            required
                        />
                        
                        <button
                            type="submit"
                            disabled={forgotStatus === 'loading'}
                            className="w-full py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50"
                        >
                            {forgotStatus === 'loading' ? 'Enviando...' : 'Enviar Correo'}
                        </button>
                    </form>
                  ) : (
                      <div className="text-center p-4 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm">
                          Se ha enviado un correo con las instrucciones de recuperación.
                      </div>
                  )}

                  <button 
                    onClick={() => { setShowForgot(false); setForgotStatus('idle'); setForgotEmail(''); }}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-800 mt-2"
                  >
                    Volver al inicio de sesión
                  </button>
              </div>
          )}

          <div className="mt-6 text-center">
              {/* Demo credentials removed */}
          </div>
        </div>
      </div>
      
      <footer className="text-center text-slate-500 text-xs">
        <p>© {new Date().getFullYear()} SGI-Construct. Todos los derechos reservados.</p>
        <p>Autor: Carlos Alfredo Percca Anchapuri | carlos.percca.13@gmail.com</p>
      </footer>
    </div>
  );
};
