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
    let isblackAndMedium = false

    productGridItem?.forEach((product) => {
        const popupTriggerBtn = product?.querySelector(".productGrid__btn");

        popupTriggerBtn?.addEventListener("click", () => {
            try {
                activeProduct = JSON.parse(popupTriggerBtn.dataset.product);
                console.log(activeProduct, 'activeProduct')
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

            optionWrapper.appendChild(optionLabel);

            const uniqueValues = [
                ...new Set(
                    product.variants.map((variant) => variant.options[optionIndex])
                ),
            ];



            if (optionName.toLowerCase() === "color") {

                const tabsWrapper = document.createElement("div");
                tabsWrapper.classList.add("quickAdd__colorTabs");

                const indicator = document.createElement("span");
                indicator.classList.add("quickAdd__colorIndicator");
                tabsWrapper.appendChild(indicator);

                uniqueValues.forEach((value, index) => {

                    const tab = document.createElement("button");
                    tab.type = "button";
                    tab.classList.add("quickAdd__colorTab");
                    tab.dataset.value = value;

                    const colorName = document.createElement("span");
                    colorName.classList.add("quickAdd__colorName");
                    colorName.textContent = value;

                    const colorDot = document.createElement("span");
                    colorDot.classList.add("quickAdd__colorDot");
                    colorDot.style.backgroundColor = value.toLowerCase();

                    tab.appendChild(colorName);
                    tab.appendChild(colorDot);
                    tabsWrapper.appendChild(tab);

                    if (index === 0) {
                        tab.classList.add("active");
                        selectedOptions[optionIndex] = value;

                        requestAnimationFrame(() => {
                            moveIndicator(tab, indicator);
                        });
                    }

                    tab.addEventListener("click", () => {
                        tabsWrapper.querySelectorAll(".quickAdd__colorTab")
                            .forEach(t => t.classList.remove("active"));

                        tab.classList.add("active");
                        selectedOptions[optionIndex] = value;

                        moveIndicator(tab, indicator);
                        updateVariantSelection();
                    });
                });

                container.appendChild(tabsWrapper);

            }

            if (optionName.toLowerCase() !== "color") {
                const variantSelect = document.createElement("select");
                variantSelect.dataset.optionIndex = optionIndex;
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

                optionWrapper.appendChild(variantSelect);
                container.appendChild(optionWrapper);
            }
        });

        updateVariantSelection();
    }

    function moveIndicator(activeTab, indicator) {
        const rect = activeTab.getBoundingClientRect();
        const parentRect = activeTab.parentElement.getBoundingClientRect();

        indicator.style.width = `${rect.width}px`;
        indicator.style.transform = `translateX(${rect.left - parentRect.left}px)`;
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

    function handleIsBlackAndMedium() {
        let currproduct = activeProduct?.variants.find((item) => item.id === selectedVariantId);
        if (!currproduct) return false;
        return currproduct.option1 === 'M' && currproduct.option2 === 'Black';
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

            const isblackAndMedium = handleIsBlackAndMedium()

            if (isblackAndMedium) {
                await fetch("/cart/add.js", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: 51551820218500,
                        quantity: 1,
                    }),
                });
            }

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

const cursor = document.querySelector('.custom-cursor');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.productGrid__btn')) {
        cursor.style.opacity = '1';
    } else {
        cursor.style.opacity = '0';
    }
});

// (function () {
//     const originalDispatch = EventTarget.prototype.dispatchEvent
//     EventTarget.prototype.dispatchEvent = (event) => {
//         console.log('Custom__events', event)
//     }
// })()


document.addEventListener("DOMContentLoaded", () => {
    const burgerMenu = document.querySelector('.header__menu');
    const burgerContent = document.querySelector('.header__content');

    burgerMenu.addEventListener("click", () => {
        burgerMenu.classList.toggle('active')
        burgerContent.classList.toggle('active')
    })
})