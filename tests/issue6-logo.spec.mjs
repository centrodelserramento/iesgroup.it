import { expect, test } from '@playwright/test';

test('issue 6 shows the official certified logo in header and footer', async ({ page }) => {
  await page.goto('/');

  const expectedLogo = /ies-velux-certified-lockup\.png$/;
  const headerLogo = page.locator('.certified-lockup-nav');
  const footerBrandLogo = page.locator('.brand-col .footer-logo');
  const footerCertLogo = page.locator('.footer-cert-logo');

  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveAttribute('src', expectedLogo);
  await expect(footerBrandLogo).toHaveAttribute('src', expectedLogo);
  await expect(footerCertLogo).toHaveAttribute('src', expectedLogo);

  await expect(page.locator('.brand-green-mark')).toHaveCount(0);
  await expect(page.getByText('EQG')).toHaveCount(0);

  const headerBox = await headerLogo.boundingBox();
  expect(headerBox?.width).toBeGreaterThan(250);
  expect(headerBox?.height).toBeGreaterThan(50);
  expect((headerBox?.width ?? 0) / (headerBox?.height ?? 1)).toBeGreaterThan(3);
});
