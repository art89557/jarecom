"""Membuat suara efek orisinal Jar'ecom (nada cerah, pendek, gaya gim belajar).
Jalankan: python3 tools/gen-sfx.py  -> menulis public/sfx/*.wav
Tidak memakai sampel dari pihak lain."""
import numpy as np
from scipy.io import wavfile

SR = 44100

def tone(freq, dur, amp=1.0, partials=((1, 1.0), (2, 0.35), (3, 0.12)), attack=0.006, decay=9.0, glide=None):
    t = np.arange(int(SR * dur)) / SR
    f = freq if glide is None else np.linspace(freq, glide, t.size)
    phase = 2 * np.pi * np.cumsum(f if np.ndim(f) else np.full(t.size, f)) / SR
    y = sum(a * np.sin(h * phase) for h, a in partials)
    env = np.minimum(t / attack, 1.0) * np.exp(-decay * t)
    fade = np.minimum((dur - t) / 0.02, 1.0)  # hilangkan bunyi klik di ujung
    return amp * y * env * fade

def mix(parts, total):
    out = np.zeros(int(SR * total))
    for start, y in parts:
        i = int(SR * start)
        out[i:i + y.size] += y[: out.size - i]
    return out

def save(name, y, peak=0.8):
    y = y / max(np.abs(y).max(), 1e-9) * peak
    wavfile.write(f'public/sfx/{name}.wav', SR, (y * 32767).astype(np.int16))
    print(name, f'{y.size / SR:.2f} dtk')

# Benar: dua nada naik yang riang (G5 lalu C6).
save('benar', mix([(0.0, tone(784, 0.30, 0.8, decay=10)), (0.085, tone(1046.5, 0.42, 1.0, decay=7))], 0.5))
# Salah: satu nada rendah yang turun lembut, tidak menghukum.
save('salah', mix([(0.0, tone(330, 0.34, 1.0, partials=((1, 1.0), (2, 0.18)), decay=8, glide=246.9))], 0.36), peak=0.6)
# Lulus: arpeggio naik C5 E5 G5 C6 lalu E6 ditahan, dengan kilau tipis.
notes = [523.25, 659.25, 783.99, 1046.5]
parts = [(k * 0.1, tone(f, 0.45, 0.8, decay=6)) for k, f in enumerate(notes)]
parts.append((0.4, tone(1318.5, 0.9, 1.0, decay=3.5)))
parts.append((0.4, tone(1046.5, 0.9, 0.5, decay=3.5)))
parts.append((0.55, tone(2093, 0.5, 0.18, partials=((1, 1.0),), decay=7)))
save('lulus', mix(parts, 1.4))
# Tekan: ketukan sangat pendek saat memilih opsi.
save('tekan', mix([(0.0, tone(1320, 0.07, 1.0, partials=((1, 1.0), (2, 0.2)), attack=0.002, decay=45))], 0.08), peak=0.45)
