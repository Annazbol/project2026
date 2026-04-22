import asyncio
import aiohttp
import socket
import ssl
import urllib.request

print("=" * 50)
print("ТЕСТ 1: Сырой сокет (TCP)")
print("=" * 50)
try:
    sock = socket.create_connection(("149.154.166.110", 443), timeout=10)
    print("✅ TCP-соединение успешно!")
    sock.close()
except Exception as e:
    print(f"❌ TCP: {e}")

print("\n" + "=" * 50)
print("ТЕСТ 2: urllib (синхронный HTTPS)")
print("=" * 50)
try:
    resp = urllib.request.urlopen("https://api.telegram.org", timeout=10)
    print(f"✅ urllib: статус {resp.status}")
except Exception as e:
    print(f"❌ urllib: {e}")

print("\n" + "=" * 50)
print("ТЕСТ 3: aiohttp (асинхронный)")
print("=" * 50)

async def test_aiohttp():
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get("https://api.telegram.org") as resp:
                print(f"✅ aiohttp: статус {resp.status}")
    except Exception as e:
        print(f"❌ aiohttp: {type(e).__name__}: {e}")

    # Попытка без SSL-верификации
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get("https://api.telegram.org", ssl=False) as resp:
                print(f"✅ aiohttp (ssl=False): статус {resp.status}")
    except Exception as e:
        print(f"❌ aiohttp (ssl=False): {type(e).__name__}: {e}")

asyncio.run(test_aiohttp())

print("\n" + "=" * 50)
print("ТЕСТ 4: Версии")
print("=" * 50)
import sys
print(f"Python: {sys.version}")
print(f"aiohttp: {aiohttp.__version__}")
print(f"SSL: {ssl.OPENSSL_VERSION}")