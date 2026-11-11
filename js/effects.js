function showToast(text) {
  $("<div>", { class: "toast", role: "status" })
    .text(text)
    .appendTo("body")
    .hide()
    .fadeIn(200)
    .delay(1500)
    .fadeOut(300, function () {
      $(this).remove();
    });
}

function countUp($element) {
  const target = Number($element.data("target"));
  $({ value: 0 }).animate({ value: target }, {
    duration: 1200,
    step: function (now) {
      $element.text(Math.floor(now));
    },
    complete: function () {
      $element.text(target);
    }
  });
}

function openQuickView(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  $("#qvImg").attr({ src: "images/tech" + product.img + ".svg", alt: product.name });
  $("#qvTitle").text(product.name);
  $("#qvDesc").text(product.desc);
  $("#qvPrice").text("$" + product.price);
  $("#quickView").attr("aria-hidden", "false").css("display", "flex").hide().fadeIn(250);
}

function closeQuickView() {
  $("#quickView").attr("aria-hidden", "true").fadeOut(200);
}

$(function () {
  $(".section, .hero").hide().fadeIn(500);

  $(".stat-num").each(function () {
    countUp($(this));
  });

  $("#productGrid").on("click", ".add-btn", function () {
    showToast($(this).closest(".product").find("h3").text() + " added to cart");
  });

  $("#productGrid").on("click", ".wish-btn", function () {
    const saved = !$(this).hasClass("active");
    $(this)
      .toggleClass("active", saved)
      .attr("aria-pressed", String(saved))
      .html(saved ? "&#9829;" : "&#9825;");
    showToast(saved ? "Saved to wishlist" : "Removed from wishlist");
  });

  $("#productGrid").on("click", ".view-btn", function () {
    openQuickView(Number($(this).data("id")));
  });

  $("#qvClose").on("click", closeQuickView);

  $("#quickView").on("click", function (event) {
    if (event.target === this) closeQuickView();
  });

  $(document).on("keydown", function (event) {
    if (event.key === "Escape" && $("#quickView").is(":visible")) closeQuickView();
  });

  $("#toTop").on("click", function () {
    $("html, body").animate({ scrollTop: 0 }, 400);
  });
});
