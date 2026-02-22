// @ts-nocheck
document.addEventListener("DOMContentLoaded", () => {
    const productGridItem = document.querySelectorAll(".productGrid__item");

    const quickAddPopup = document.querySelector(".quickAdd__popup");
    const quickAddOverlay = document.querySelector(".quickAdd__overlay");
    const quickAddCloseBtn = document.querySelector(".quickAdd__closeBtn");
    const quickAddForm = document.querySelector(".quickAdd__form");

    let activeProduct = null;
    let selectedOptions = {};
    let selectedVariantId = null;

    productGridItem?.forEach((product) => {
        const popupTriggerBtn = product?.querySelector(".productGrid__btn");

        popupTriggerBtn?.addEventListener("click", () => {
            try {
                activeProduct = JSON.parse(popupTriggerBtn.dataset.product);
            } catch (err) {
                console.error("Invalid product JSON", err);
                return;
            }

            selectedOptions = {};
            selectedVariantId = null;

            renderPopupHtml(activeProduct);
            renderVariants(activeProduct);

            quickAddPopup?.classList.add("show");
        });
    });

    function renderPopupHtml(product) {
        const quickAddImg = document.querySelector(".quickAdd__img");
        const quickAddTitle = document.querySelector(".quickAdd__title");
        const quickAddPrice = document.querySelector(".quickAdd__price");
        const quickAddDesp = document.querySelector(".quickAdd__desp");

        if (quickAddImg && product.featured_image) {
            quickAddImg.src = product.featured_image;
            quickAddImg.alt = product.title || "";
        }

        if (quickAddTitle) quickAddTitle.textContent = product.title || "";

        if (quickAddPrice)
            quickAddPrice.textContent = product.variants?.[0]?.price || "";

        if (quickAddDesp)
            quickAddDesp.innerHTML = product.description || "";
    }

    function renderVariants(product) {
        const container = document.querySelector(".quickAdd__variants");
        if (!container) return;

        container.innerHTML = "";

        product?.options?.forEach((optionName, optionIndex) => {
            const optionWrapper = document.createElement("div");
            optionWrapper.classList.add("quickAdd__variantWrapper");

            const optionLabel = document.createElement("label");
            optionLabel.textContent = optionName;
            optionLabel.classList.add("quickAdd__optionLabel");

            const variantSelect = document.createElement("select");
            variantSelect.dataset.optionIndex = optionIndex;

            const uniqueValues = [
                ...new Set(
                    product.variants.map((variant) => variant.options[optionIndex])
                ),
            ];

            uniqueValues.forEach((value) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                variantSelect.appendChild(option);
            });

            selectedOptions[optionIndex] = uniqueValues[0];

            variantSelect.addEventListener("change", (e) => {
                selectedOptions[optionIndex] = e.target.value;
                updateVariantSelection();
            });

            optionWrapper.appendChild(optionLabel);
            optionWrapper.appendChild(variantSelect);
            container.appendChild(optionWrapper);
        });

        updateVariantSelection();
    }

    function updateVariantSelection() {
        if (!activeProduct) return;

        const matchedVariant = activeProduct.variants.find((variant) =>
            variant.options.every(
                (value, index) => selectedOptions[index] === value
            )
        );

        if (matchedVariant) {
            selectedVariantId = matchedVariant.id;

            const priceEl = document.querySelector(".quickAdd__price");
            if (priceEl) priceEl.textContent = matchedVariant.price;
        } else {
            selectedVariantId = null;
        }
    }

    async function handleAddToCart() {
        try {
            await fetch("/cart/add.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedVariantId,
                    quantity: 1,
                }),
            });
            const sections = await fetch('/?sections=sections--27251834388612__header_section').then(res => res.json());
            document.dispatchEvent(
                new CustomEvent('cart:update', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        resource: {},
                        sourceId: selectedVariantId,
                        data: {
                            soure: 'product-form-component',
                            itemCount: 1,
                            productId: activeProduct?.id,
                            sections
                        }
                    }
                })
            )

        } catch (error) {
            console.error("Add to cart failed", error);
        }
    }

    function handleOpenTheDrawer() {
        const drawer = document.querySelector('cart-drawer-component');
        drawer?.showDialog();
    }

    function closePopup() {
        quickAddPopup?.classList.remove("show");
        selectedOptions = {};
        selectedVariantId = null;
    }

    quickAddForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!selectedVariantId) return;

        await handleAddToCart();
        handleOpenTheDrawer()

        closePopup();
    });

    quickAddCloseBtn?.addEventListener("click", closePopup);
    quickAddOverlay?.addEventListener("click", closePopup);
});


// (function () {
//     const originalDispatch = EventTarget.prototype.dispatchEvent
//     EventTarget.prototype.dispatchEvent = (event) => {
//         console.log('Custom__events', event)
//     }
// })()