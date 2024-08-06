# ComfyUI Workflow Loader

ComfyUI Workflow Loader, ComfyUI iş akışlarını yönetmek ve manipüle etmek için tasarlanmış bir Node.js kütüphanesidir. Bu kütüphane, iş akışı JSON dosyalarını yüklemenize, yer tutucuları doldurmanıza ve iş akışlarına dayalı görüntüler oluşturmanıza olanak tanır.

## Özellikler

- ComfyUI iş akışı JSON dosyalarını yükleme
- Yer tutucuları otomatik olarak tespit etme
- Yer tutucuları programatik olarak doldurma
- Eksik yer tutucular için varsayılan değerler sağlama
- Güncellenmiş iş akışlarını JSON formatında oluşturma
- İş akışına dayalı görüntüler oluşturma
- Oluşturulan görüntüleri kaydetme seçeneği

## Kurulum

ComfyUI Workflow Loader'ı npm kullanarak yükleyin:

```bash
npm install comfyui-workflow-loader
```

## Kullanım

- ComfyUi bilgisayarınızda veya ulaşılabilir bir ağda açık ve çalışıyor olmalı

### Hazırlık

ComfyUI'yi açın, iş akışınızı yükleyin veya düzenleyin, ardından API formatında kaydedin.

- İş akışını düzenleyerek yer tutucular ekleyin.
- Yer tutucular süslü parantezler içinde olmalıdır.
- Yollar veya diğer kaçış karakterleri iki kez yazılmalıdır.
  Örnek:

```json
"ckpt_name": "Stable-diffusion\\SdXl\\sd_xl_turbo_1.0_fp16.safetensors"
```

Yollar için iki tane \ kullanılır.

- Sayısal değerler için şu sözdizimini kullanın:

```json
 "width": {width}
```

({width} etrafında tırnak işareti yok)

- Dizeler için (pozitif veya negatif prompt ya da model yolları gibi) şu sözdizimini kullanın:

```json
   "text": "{positive}"
```

(Yer tutucuların etrafında tırnak işaretleri var)

- Projenizin kök dizinindeki "workflows" adlı bir klasöre kaydedin.

### Temel Kullanım

```javascript
import { startComfyUi, initClient } from "./src/utils.js";
import Workflowloader from "./src/index.js";

// İstemciyi başlat
let client = await initClient(/*comfyuiaddress*/); //varsayılan 127.0.0.1:8188
await client.connect();

// İş akışını yükle
let flux = new Workflowloader("sdxl_turbo.json", client, true);

// Yer tutucuları hazırla
flux.prepare({
  positive: "kırmızı takım elbiseli, basketbol atan bir kedi",
  steps: 1,
  batchSize: 2,
});

// Ek yer tutucuları ayarla
flux.width = 768;

// Görüntüleri oluştur
let sonuc = await flux.generate();

// Yeni yer tutucular hazırla ve tekrar oluştur
flux.prepare({
  positive: "bir zürafa",
  steps: 1,
});
await flux.generate();

console.log("Tamamlandı");
```

## API

### `Workflowloader(workflowPath, client, saveImages)`

Yeni bir Workflowloader örneği oluşturur.

- `workflowPath`: İş akışı JSON dosyasının yolu.
- `client`: ComfyUI istemci örneği.
- `saveImages`: Boolean, oluşturulan görüntülerin kaydedilip kaydedilmeyeceği (varsayılan: false).

### `prepare(obj)`

Verilen nesneyi kullanarak yer tutucuları doldurur.

- `obj`: Yer tutucu değerlerini içeren bir nesne.
- Döndürülen değer: `{ missingPlaceholders, extraKeys }` şeklinde bir nesne.

### `generate()`

Mevcut iş akışına dayalı görüntüler oluşturur.

- Döndürülen değer: Oluşturulan görüntü verisini içeren bir Promise.

### `finalize`

Güncellenmiş iş akışını döndürür.

- Döndürülen değer: `{ status: boolean, workflow: string | null, message: string | null }`

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! Lütfen bir pull request göndermeden önce katkıda bulunma kılavuzumuzu okuyun.

## İletişim

Sorularınız veya geri bildirimleriniz için lütfen [GitHub Issues](https://github.com/kullaniciadi/comfyui-workflow-loader/issues) kullanın.
