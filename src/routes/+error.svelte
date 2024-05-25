<script>
	import { page } from '$app/stores';
	import Box from '$lib/components/Box.svelte';

	const zu =
		'4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qG/4qCf4qCL4qCJ4qCJ4qCE4qCQ4qCg4qKA4qCE4qCE4qCE4qKA4qGY4qKm4qGA4qKACuKjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Khv+Kii+KjpOKjpuKjpOKjtuKjtuKjtuKjpuKhhOKghOKgkeKghOKghOKgkOKgkeKghOKjveKjtwrio7/io7/io7/io7/io7/io7/io7/io7/io7/io7/io7/iorHio7/io7/io7/io7/io7/io7/io7/io7/io7/io4bioITioITioITioITioITiorjio7/io78K4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qGH4qCB4qKo4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qG/4qCX4qCE4qCE4qCE4qCE4qCE4qC44qO/4qO/CuKjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kgj+KgiOKhgOKghOKgoOKghOKghOKghOKghOKimeKil+KhgOKghOKjoOKhgOKghOKghOKghOKiuOKjvwrio7/io7/io7/io7/io7/io7/io7/io7/io7/io7fioZjioITioITioITio6DioYDioYTioITioITioo7io7/iobbiorbioITioYPioITioITioITio7zio78K4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qOn4qCB4qCB4qCI4qCJ4qCJ4qKa4qON4qOp4qGA4qCE4qKA4qCE4qC64qCE4qCE4qCE4qCE4qO/4qO/CuKjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+KhhOKghOKikuKhm+Khm+Kgm+Kgm+Kiv+KhgeKghOKgieKghOKghOKghOKjoOKhhOKguOKjv+Kjvwrio7/io7/io7/io7/io7/io7/io7/io7/io7/io7/io7/io6fioITioInioonioYnioYnioIHioITioIHioqDioY7ioITio4DiorDio7/ioIHioITior/io78K4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO/4qO34qGE4qCE4qCE4qCE4qCE4qCE4qCE4qK84qGH4qKi4qOP4qCE4qCE4qCE4qCE4qO44qO/CuKjv+Kjv+Khv+Kgu+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Kjv+Khv+Kgm+KggeKghOKghOKghOKghOKghOKghOKgmeKggeKioOKjv+Kjt+KjhOKjgOKghOKjv+Kjvwrio4/iooDioITioITioojio6/io7/io7/io7/io7/io7/ioIfioITioITioITioITioITioITioITioITioITioITio7zio7/io7/io7/io7/io7/io7/io78K4qGf4qCb4qCb4qKb4qOf4qGb4qCb4qCb4qO/4qO/4qO/4qCE4qCE4qCE4qCE4qCE4qCE4qCE4qCE4qCE4qKA4qG44qO/4qO/4qO/4qO/4qK/4qO/4qO/4qO/CuKggeKghOKghOKiiOKgieKggeKghOKghOKjueKjv+Kjv+KghOKghOKghOKghOKghOKghOKghOKghOKioOKjvuKjt+Kjv+Kjv+KjreKjvuKjv+Kjv+Kjv+KjvwrioITioITioITioITioIHioITioITioITior/io7/io7/ioITioITioITioITioITioITioITioqDio7/io7/io7/io7/io7/iob/iorvio7/io7/io5/io78=';
	const lul = new TextDecoder().decode(Uint8Array.from(atob(zu), (n) => n.codePointAt(0) || 0));
</script>

<div class="container mx-auto flex grow p-4 lg:p-0 lg:py-12">
	<Box class="flex grow gap-2 !bg-red-200 p-12 dark:!bg-red-950 dark:!bg-opacity-50">
		<div class="prose prose-2xl max-w-[unset] grow dark:prose-invert">
			<h2>{$page.status}</h2>
			<p>{$page.error?.message}</p>
		</div>

		<div class="self-center">
			<pre class="h-fit overflow-hidden rounded-full bg-slate-950 text-white">{lul}</pre>
		</div>
	</Box>
</div>
