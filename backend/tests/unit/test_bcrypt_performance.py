#!/usr/bin/env python3
"""
Teste de performance do bcrypt para identificar o problema de timeout.
"""
import time
from passlib.context import CryptContext
from core.config import settings

def test_bcrypt_performance():
    """Testa a performance do bcrypt com diferentes configurações."""
    print("🔍 Testando performance do bcrypt...")
    print(f"📋 Configuração atual: bcrypt_rounds = {settings.bcrypt_rounds}")
    
    # Configuração atual
    pwd_context_current = CryptContext(
        schemes=["bcrypt"],
        deprecated="auto",
        bcrypt__rounds=settings.bcrypt_rounds
    )
    
    # Configuração otimizada
    pwd_context_fast = CryptContext(
        schemes=["bcrypt"],
        deprecated="auto",
        bcrypt__rounds=8
    )
    
    test_password = "123456"
    test_answer = "dog"
    
    print("\n🧪 Teste 1: Configuração atual")
    start_time = time.time()
    hash1 = pwd_context_current.hash(test_password)
    password_time = time.time() - start_time
    print(f"⏱️ Hash da senha: {password_time:.2f}s")
    
    start_time = time.time()
    hash2 = pwd_context_current.hash(test_answer)
    answer_time = time.time() - start_time
    print(f"⏱️ Hash da resposta: {answer_time:.2f}s")
    
    total_time_current = password_time + answer_time
    print(f"⏱️ Tempo total (atual): {total_time_current:.2f}s")
    
    print("\n🧪 Teste 2: Configuração otimizada (8 rounds)")
    start_time = time.time()
    hash3 = pwd_context_fast.hash(test_password)
    password_time_fast = time.time() - start_time
    print(f"⏱️ Hash da senha: {password_time_fast:.2f}s")
    
    start_time = time.time()
    hash4 = pwd_context_fast.hash(test_answer)
    answer_time_fast = time.time() - start_time
    print(f"⏱️ Hash da resposta: {answer_time_fast:.2f}s")
    
    total_time_fast = password_time_fast + answer_time_fast
    print(f"⏱️ Tempo total (otimizado): {total_time_fast:.2f}s")
    
    print("\n📊 Análise:")
    if total_time_current > 10:
        print(f"❌ PROBLEMA: Tempo atual ({total_time_current:.2f}s) causa timeout!")
        print(f"✅ SOLUÇÃO: Tempo otimizado ({total_time_fast:.2f}s) é aceitável")
        print(f"🚀 Melhoria: {total_time_current/total_time_fast:.1f}x mais rápido")
    else:
        print(f"✅ Tempo atual ({total_time_current:.2f}s) é aceitável")
    
    print(f"\n💡 RECOMENDAÇÃO:")
    if total_time_current > 5:
        print(f"   - Reinicie o backend para aplicar bcrypt_rounds = 8")
        print(f"   - Isso reduzirá o tempo de {total_time_current:.2f}s para {total_time_fast:.2f}s")
    else:
        print(f"   - Configuração atual está adequada")

if __name__ == "__main__":
    test_bcrypt_performance()
